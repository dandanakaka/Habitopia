from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from core.firebase_setup import db
from core.config import settings
from google.cloud.firestore_v1 import transactional, Increment
from datetime import datetime, time, timezone, timedelta
import uuid

router = APIRouter(prefix="/realms", tags=["Realms"])


@router.post("/create")
async def create_realm(name: str, user: dict = Depends(verify_firebase_token)):
    """Creates a new Village and assigns the creator as the first member."""
    realm_id = str(uuid.uuid4())[:8]  # Short unique ID for invite links

    realm_data = {
        "realm_id": realm_id,
        "name": name,
        "creator_uid": user["uid"],
        "members": [user["uid"]],
        "member_cap": settings.VILLAGE_MAX_MEMBERS,
        "health": 100,
        "total_xp": 0,
        "status": "active",
    }

    db.collection("realms").document(realm_id).set(realm_data)
    return {"message": "Village created", "realm_id": realm_id}


@router.post("/{realm_id}/join")
async def join_realm(realm_id: str, user: dict = Depends(verify_firebase_token)):
    """
    Allows a user to join a village if the cap hasn't been reached.

    Uses a Firestore transaction to prevent race conditions where
    multiple simultaneous joins could exceed the member cap.
    """
    realm_ref = db.collection("realms").document(realm_id)
    transaction = db.transaction()

    @transactional
    def join_in_transaction(txn, ref, uid):
        snapshot = ref.get(transaction=txn)

        if not snapshot.exists:
            raise HTTPException(status_code=404, detail="Village not found")

        data = snapshot.to_dict()

        if uid in data["members"]:
            return {"message": "Already a member", "realm_id": realm_id}

        if len(data["members"]) >= data["member_cap"]:
            raise HTTPException(status_code=400, detail="Village is full")

        updated_members = data["members"] + [uid]
        txn.update(ref, {"members": updated_members})
        return {"message": f"Joined {data['name']}", "realm_id": realm_id}

    return join_in_transaction(transaction, realm_ref, user["uid"])


@router.get("/{realm_id}")
async def get_realm(realm_id: str, user: dict = Depends(verify_firebase_token)):
    """Fetches the current state of a village."""
    realm_ref = db.collection("realms").document(realm_id)
    realm = realm_ref.get()

    if not realm.exists:
        raise HTTPException(status_code=404, detail="Village not found")

    data = realm.to_dict()

    # Only members can view village details
    if user["uid"] not in data["members"]:
        raise HTTPException(status_code=403, detail="You are not a member of this village")

    return data


@router.get("/{realm_id}/stats")
async def get_realm_member_stats(realm_id: str, user: dict = Depends(verify_firebase_token)):
    """Fetches member stats (habit completions today) for a village."""
    realm_ref = db.collection("realms").document(realm_id)
    realm = realm_ref.get()

    if not realm.exists:
        raise HTTPException(status_code=404, detail="Village not found")

    data = realm.to_dict()
    if user["uid"] not in data["members"]:
        raise HTTPException(status_code=403, detail="You are not a member of this village")

    from datetime import datetime, timezone

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    member_stats = []

    for member_uid in data["members"]:
        logs = (
            db.collection("habit_logs")
            .where("user_uid", "==", member_uid)
            .where("date", "==", today)
            .stream()
        )
        completions = sum(1 for _ in logs)
        member_stats.append({"uid": member_uid, "completions_today": completions})

    return {"realm_id": realm_id, "members": member_stats}


@router.post("/nightly-reset")
async def nightly_health_reset():
    """
    Nightly Village Health Reset (Called via Cron).
    1. Subtracts 100 from every realm's health.
    2. Evaluates user streaks based on habit completion.
    3. Resets all habit statuses to 0.
    4. Cleans up old habit_logs.
    """
    try:
        # Use managed batches for resets (Firestore limit is 500 per batch)
        batch = db.batch()
        op_count = 0

        def commit_if_full():
            nonlocal batch, op_count
            if op_count >= 400:
                batch.commit()
                batch = db.batch()
                op_count = 0

        # 1. Update Realms Health
        realms_ref = db.collection("realms").stream()
        realm_updates = 0
        for r in realms_ref:
            data = r.to_dict()
            curr_health = data.get("health", 100)
            new_health = max(0, curr_health - 100)
            batch.update(r.reference, {"health": new_health})
            realm_updates += 1
            op_count += 1
            commit_if_full()

        # 2. Evaluate User Streaks BEFORE resetting habits
        today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(tzinfo=timezone.utc)
        
        streak_updates = 0
        # Process by Realm to know N (members count)
        realms_ref = db.collection("realms").stream()
        
        # Track which users we've evaluated to avoid double-processing if in multiple realms
        evaluated_users = set()

        for r in realms_ref:
            r_data = r.to_dict()
            r_id = r.id
            members = r_data.get("members", [])
            if not members:
                continue
                
            n = len(members)
            target_share = 100 / n
            
            # Optimized: Fetch ALL logs for this realm today in one query
            realm_logs = db.collection("habit_logs").where("realm_id", "==", r_id).where("timestamp", ">=", today_start).stream()
            
            # Group logs by user_id for fast lookup
            user_log_map = {}
            for log in realm_logs:
                l_data = log.to_dict()
                uid = l_data.get("user_id")
                if uid:
                    if uid not in user_log_map:
                        user_log_map[uid] = []
                    user_log_map[uid].append(l_data)

            # Defensive: Verify which users actually exist in the users collection to avoid 404s
            user_refs = [db.collection("users").document(uid) for uid in members]
            existing_user_docs = db.get_all(user_refs)
            existing_uids = {doc.id for doc in existing_user_docs if doc.exists}

            for uid in members:
                if uid in evaluated_users or uid not in existing_uids:
                    continue
                
                # Fetch all habits for this user in this realm to get T (total user habits)
                user_habits = db.collection("habits").where("user_id", "==", uid).where("realm_id", "==", r_id).stream()
                habit_list = list(user_habits)
                t = len(habit_list) if habit_list else 1
                
                hp_per_habit = target_share / t
                
                # Use pre-fetched logs from our map
                user_logs = user_log_map.get(uid, [])
                
                contribution = 0
                for l_data in user_logs:
                    if l_data.get("habit_type") == "quest_completion":
                        contribution += (hp_per_habit * 0.5)
                    else:
                        contribution += hp_per_habit
                
                # buffer for precision
                success = contribution >= (target_share - 0.01)
                
                user_ref = db.collection("users").document(uid)
                if success:
                    batch.update(user_ref, {"streak": Increment(1)})
                else:
                    batch.update(user_ref, {"streak": 0})
                
                evaluated_users.add(uid)
                streak_updates += 1
                op_count += 1
                commit_if_full()

        # 3. Reset All Habits to 0
        all_habits = db.collection("habits").stream()
        habit_resets = 0
        for h in all_habits:
            batch.update(h.reference, {"status": 0})
            habit_resets += 1
            op_count += 1
            commit_if_full()

        if op_count > 0:
            batch.commit()
        
        # 4. Cleanup old habit_logs (> 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        old_logs = db.collection("habit_logs").where("timestamp", "<", seven_days_ago).stream()
        logs_deleted = 0
        for log in old_logs:
            log.reference.delete()
            logs_deleted += 1
            
        return {
            "message": "Nightly reset complete", 
            "realms_updated": realm_updates,
            "streaks_evaluated": streak_updates,
            "habits_reset": habit_resets,
            "logs_cleaned": logs_deleted
        }
    except Exception as e:
        print(f"Reset Error: {e}")
        return {"status": "error", "message": str(e), "type": type(e).__name__}
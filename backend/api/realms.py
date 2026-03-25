from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from core.firebase_setup import db
from core.config import settings
from google.cloud.firestore_v1 import transactional
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
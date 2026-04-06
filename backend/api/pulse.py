from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from core.firebase_setup import db
from datetime import datetime, timezone
import requests
from pydantic import BaseModel
from google.cloud.firestore_v1 import Increment, SERVER_TIMESTAMP
from services.github_sync import get_daily_github_commits, get_daily_leetcode_solves

router = APIRouter(prefix="/pulse", tags=["Pulse - Habits"])


@router.post("/habits")
async def create_habit(
    habit_id: str,
    title: str,
    habit_type: str = "manual",
    xp_value: int = 10,
    user: dict = Depends(verify_firebase_token),
):
    """
    Creates a new habit for the authenticated user.
    Uses user-provided habit_id for idempotent creation (safe to retry).
    """
    if habit_type not in ("manual", "github", "leetcode"):
        raise HTTPException(status_code=400, detail="Invalid habit type. Must be manual, github, or leetcode")

    doc_ref = db.collection("users").document(user["uid"]).collection("habits").document(habit_id)

    # Idempotent: if habit already exists, this is a no-op
    if doc_ref.get().exists:
        return {"message": "Habit already exists", "habit_id": habit_id}

    habit_data = {
        "habit_id": habit_id,
        "title": title,
        "type": habit_type,
        "xp_value": xp_value,
        "owner_uid": user["uid"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    doc_ref.set(habit_data)
    return {"message": "Habit created", "habit_id": habit_id}


@router.put("/habits/{habit_id}")
async def update_habit(
    habit_id: str,
    title: str = None,
    xp_value: int = None,
    user: dict = Depends(verify_firebase_token),
):
    """Updates an existing habit. Only the owner can update."""
    doc_ref = db.collection("users").document(user["uid"]).collection("habits").document(habit_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Habit not found")

    updates = {}
    if title is not None:
        updates["title"] = title
    if xp_value is not None:
        updates["xp_value"] = xp_value

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    doc_ref.update(updates)
    return {"message": "Habit updated", "habit_id": habit_id}


@router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: dict = Depends(verify_firebase_token)):
    """Deletes a habit. Only the owner can delete."""
    doc_ref = db.collection("users").document(user["uid"]).collection("habits").document(habit_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Habit not found")

    doc_ref.delete()
    return {"message": "Habit deleted", "habit_id": habit_id}


@router.get("/habits")
async def list_habits(user: dict = Depends(verify_firebase_token)):
    """Lists all habits for the authenticated user."""
    habits = db.collection("users").document(user["uid"]).collection("habits").stream()
    return [h.to_dict() for h in habits]


@router.post("/habits/{habit_id}/log")
async def log_habit_completion(habit_id: str, user: dict = Depends(verify_firebase_token)):
    """
    Logs a daily habit completion.

    Idempotency: Uses a composite document ID of {uid}_{habit_id}_{date}.
    Retrying this endpoint on the same day for the same habit is a safe no-op.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log_id = f"{user['uid']}_{habit_id}_{today}"

    # Check habit exists and belongs to user
    habit_ref = db.collection("users").document(user["uid"]).collection("habits").document(habit_id)
    habit = habit_ref.get()

    if not habit.exists:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Idempotent: if already logged today, return success without re-writing
    log_ref = db.collection("habit_logs").document(log_id)
    if log_ref.get().exists:
        return {"message": "Already logged today", "log_id": log_id, "duplicate": True}

    log_data = {
        "log_id": log_id,
        "user_uid": user["uid"],
        "habit_id": habit_id,
        "date": today,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "committed",
        "xp_value": habit.to_dict().get("xp_value", 10),
    }

    log_ref.set(log_data)
    return {"message": "Habit logged", "log_id": log_id, "duplicate": False}


class SyncRequest(BaseModel):
    realm_id: str

@router.post("/sync")
async def sync_integrations(req: SyncRequest, user: dict = Depends(verify_firebase_token)):
    """
    Checks user's linked GitHub/Leetcode/Strava accounts for daily activity.
    If activity exists, automatically completes their habit and awards Realm HP.
    """
    uid = user["uid"]
    realm_id = req.realm_id
    
    # 1. Get user profile for usernames
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_doc.to_dict() or {}
    github_username = user_data.get("githubName") or user_data.get("github_username") or user_data.get("github")
    leetcode_username = user_data.get("leetcodeName") or user_data.get("leetcode_username") or user_data.get("leetcode")
    
    # 2. Get Realm details for HP computation and habit_ids
    realm_ref = db.collection("realms").document(realm_id)
    realm_doc = realm_ref.get()
    if not realm_doc.exists:
        raise HTTPException(status_code=404, detail="Realm not found")
        
    realm_data = realm_doc.to_dict() or {}
    habit_ids = realm_data.get("habit_ids", [])
    
    # 3. Fetch all habits for this user from root collection
    user_habits = []
    for h_id in habit_ids:
        h_ref = db.collection("habits").document(h_id)
        h_doc = h_ref.get()
        if h_doc.exists:
            h_data = h_doc.to_dict()
            if h_data.get("user_id") == uid:
                user_habits.append((h_id, h_data, h_ref))
        
    if not user_habits:
        return {"message": "No habits to sync", "updated": 0, "hp_awarded": 0}

    members = realm_data.get("members", [])
    members_count = len(members) if members else 1
    total_habits = len(user_habits) if user_habits else 1
    hp_gain = (100 / members_count) / total_habits
    
    updated_habits = 0
    hp_awarded = 0
    
    # 4. Process Integrations
    for h_id, h_data, h_ref in user_habits:
        h_type = h_data.get("type", "manual")
        h_status = h_data.get("status", 0)
        
        # Only care about pending integrated habits
        if h_status == 1 or h_type == "manual":
            continue
            
        completed_today = False
            
        if h_type == "github" and github_username:
            res = get_daily_github_commits(github_username)
            if res.get("commits_today", 0) > 0:
                completed_today = True
                
        elif h_type == "leetcode" and leetcode_username:
            res = get_daily_leetcode_solves(leetcode_username)
            if res.get("solves_today", 0) > 0:
                completed_today = True
                
        # (Strava placeholder: requires OAuth logic not yet built)
        # elif h_type == "strava":
        #    pass
                
        if completed_today:
            # Mark habit as completed
            h_ref.update({
                "status": 1,
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            })
            
            hp_awarded += hp_gain
            updated_habits += 1
            
            # Award personal XP & completion logic
            user_ref.update({
                "xp": Increment(h_data.get("xp_value", 10)),
                "habitsCompleted": Increment(1)
            })

            # Write to habit_logs
            db.collection("habit_logs").add({
                "user_id": uid,
                "realm_id": realm_id,
                "habit_type": h_type,
                "timestamp": SERVER_TIMESTAMP,
                "xp_reward": h_data.get("xp_value", 10)
            })

    # 5. Update Realm Health
    if hp_awarded > 0:
        realm_ref.update({
            "health": Increment(hp_awarded)
        })
        
    return {
        "message": "Sync completed", 
        "updated": updated_habits, 
        "hp_awarded": hp_awarded
    }


@router.get("/validate-username")
async def validate_username(type: str, username: str):
    """
    Validates if a given username exists on the target external platform.
    """
    if type == "github":
        url = f"https://api.github.com/users/{username}"
        try:
            res = requests.get(url, timeout=10)
            return {"valid": res.status_code == 200}
        except requests.exceptions.RequestException:
            return {"valid": False}
            
    elif type == "leetcode":
        url = "https://leetcode.com/graphql"
        query = """
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                username
            }
        }
        """
        try:
            res = requests.post(url, json={'query': query, 'variables': {"username": username}}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                valid = bool(data.get("data", {}).get("matchedUser"))
                return {"valid": valid}
            return {"valid": False}
        except requests.exceptions.RequestException:
            return {"valid": False}
            
    elif type == "strava":
        # Strava requires OAuth, hard to validate publicly without token
        return {"valid": True}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid integration type")
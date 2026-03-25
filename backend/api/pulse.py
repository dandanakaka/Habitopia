from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from core.firebase_setup import db
from datetime import datetime, timezone

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
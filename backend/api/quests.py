from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from core.firebase_setup import db
from datetime import datetime, timezone

router = APIRouter(prefix="/quests", tags=["Quest System"])


@router.post("/assign")
async def assign_side_quest(
    target_uid: str,
    title: str,
    xp_reward: int = 15,
    user: dict = Depends(verify_firebase_token),
):
    """
    Assigns a challenge to a peer within the same Village.
    XP reward is capped server-side to prevent exploitation.
    """
    # Cap XP reward to prevent client manipulation
    MAX_QUEST_XP = 50
    xp_reward = min(max(xp_reward, 5), MAX_QUEST_XP)

    if target_uid == user["uid"]:
        raise HTTPException(status_code=400, detail="Cannot assign a quest to yourself")

    # Validate both users are in the same village
    assigner_realms = db.collection("realms").where("members", "array_contains", user["uid"]).stream()
    assigner_realm_ids = {r.id for r in assigner_realms}

    target_realms = db.collection("realms").where("members", "array_contains", target_uid).stream()
    target_realm_ids = {r.id for r in target_realms}

    shared_realms = assigner_realm_ids & target_realm_ids
    if not shared_realms:
        raise HTTPException(status_code=403, detail="Target user is not in any of your villages")

    quest_data = {
        "assigner_uid": user["uid"],
        "target_uid": target_uid,
        "title": title,
        "xp_reward": xp_reward,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _, doc_ref = db.collection("quests").add(quest_data)
    return {"quest_id": doc_ref.id, "status": "assigned"}


@router.get("/my-quests")
async def get_active_quests(user: dict = Depends(verify_firebase_token)):
    """Fetches all pending challenges assigned to the user."""
    quests = (
        db.collection("quests")
        .where("target_uid", "==", user["uid"])
        .where("status", "==", "pending")
        .stream()
    )
    return [{"quest_id": q.id, **q.to_dict()} for q in quests]


@router.post("/{quest_id}/accept")
async def accept_quest(quest_id: str, user: dict = Depends(verify_firebase_token)):
    """Accept a pending quest assigned to you."""
    doc_ref = db.collection("quests").document(quest_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quest not found")

    data = doc.to_dict()
    if data["target_uid"] != user["uid"]:
        raise HTTPException(status_code=403, detail="This quest is not assigned to you")

    if data["status"] != "pending":
        return {"message": f"Quest already {data['status']}", "quest_id": quest_id}

    doc_ref.update({"status": "accepted"})
    return {"message": "Quest accepted", "quest_id": quest_id}


@router.post("/{quest_id}/decline")
async def decline_quest(quest_id: str, user: dict = Depends(verify_firebase_token)):
    """Decline a pending quest assigned to you."""
    doc_ref = db.collection("quests").document(quest_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quest not found")

    data = doc.to_dict()
    if data["target_uid"] != user["uid"]:
        raise HTTPException(status_code=403, detail="This quest is not assigned to you")

    if data["status"] != "pending":
        return {"message": f"Quest already {data['status']}", "quest_id": quest_id}

    doc_ref.update({"status": "declined"})
    return {"message": "Quest declined", "quest_id": quest_id}


@router.post("/{quest_id}/complete")
async def complete_quest(quest_id: str, user: dict = Depends(verify_firebase_token)):
    """
    Mark a quest as completed. Awards XP to the completing user.
    Idempotent: if already completed, returns success without re-granting XP.
    """
    doc_ref = db.collection("quests").document(quest_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quest not found")

    data = doc.to_dict()
    if data["target_uid"] != user["uid"]:
        raise HTTPException(status_code=403, detail="This quest is not assigned to you")

    if data["status"] == "completed":
        return {"message": "Quest already completed", "quest_id": quest_id, "duplicate": True}

    if data["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Quest must be accepted before completing")

    doc_ref.update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
    })

    # XP reward will be processed by the XP engine (wired in Phase 2)
    return {
        "message": "Quest completed",
        "quest_id": quest_id,
        "xp_awarded": data["xp_reward"],
        "duplicate": False,
    }
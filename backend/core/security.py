from fastapi import Header, HTTPException, Depends
from firebase_admin import auth
from .firebase_setup import firebase_auth

async def verify_firebase_token(authorization: str = Header(None)):
    """
    Dependency to verify the Firebase ID token from the Authorization header.
    Expects format: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid Authorization header"
        )

    token = authorization.split("Bearer ")[1]

    try:
        # Verifies the signature and expiration of the token
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401, 
            detail=f"Invalid authentication credentials: {str(e)}"
        )
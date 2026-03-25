import firebase_admin
from firebase_admin import credentials, firestore, auth
from core.config import settings

if not firebase_admin._apps:
    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# Exporting database and auth helpers
db = firestore.client()
firebase_auth = auth
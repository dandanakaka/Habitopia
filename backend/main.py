from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.realms import router as realms_router
from api.pulse import router as pulse_router
from api.quests import router as quests_router

app = FastAPI(
    title="Habitopia",
    description="Multiplayer habit-tracking RPG backend",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "Habitopia backend running"}
    
# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all REST methods
    allow_headers=["*"],  # Allows all headers
)

# Register API routers
app.include_router(realms_router)
app.include_router(pulse_router)
app.include_router(quests_router)


@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}
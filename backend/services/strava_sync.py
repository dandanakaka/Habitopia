import time
from datetime import datetime, timezone

import requests

from core.config import settings


STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"


def _refresh_strava_token(refresh_token: str) -> dict | None:
    """
    Exchange a refresh_token for a new access_token. Returns the parsed JSON
    response on success or None on failure.
    """
    if not settings.STRAVA_CLIENT_ID or not settings.STRAVA_CLIENT_SECRET:
        return None
    try:
        res = requests.post(
            STRAVA_TOKEN_URL,
            data={
                "client_id": settings.STRAVA_CLIENT_ID,
                "client_secret": settings.STRAVA_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            timeout=10,
        )
        if res.status_code != 200:
            return None
        return res.json()
    except requests.exceptions.RequestException:
        return None


def get_daily_strava_activity(user_data: dict) -> dict:
    """
    Checks if the user has logged any Strava activity today (UTC).

    Expects user_data to contain:
      - strava_access_token: str
      - strava_refresh_token: str
      - strava_token_expires_at: int (Unix timestamp)
      - strava_athlete_id: str

    Returns:
      { "athlete_id": ..., "activities_today": int, "refreshed_tokens": {...} | None }
      or { "error": "not_connected" } if tokens are missing
      or { "error": "token_refresh_failed" } if refresh fails
    """
    access_token = user_data.get("strava_access_token")
    refresh_token = user_data.get("strava_refresh_token")
    expires_at = user_data.get("strava_token_expires_at") or 0
    athlete_id = user_data.get("strava_athlete_id")

    if not access_token:
        return {"error": "not_connected"}

    refreshed_tokens = None

    # Refresh if the access token is expired or within 60 seconds of expiring.
    if refresh_token and (int(expires_at) - int(time.time())) < 60:
        refresh_res = _refresh_strava_token(refresh_token)
        if not refresh_res or "access_token" not in refresh_res:
            return {"error": "token_refresh_failed"}

        access_token = refresh_res["access_token"]
        refreshed_tokens = {
            "strava_access_token": refresh_res["access_token"],
            "strava_refresh_token": refresh_res.get("refresh_token", refresh_token),
            "strava_token_expires_at": refresh_res.get("expires_at", expires_at),
        }

    # Compute "today 00:00 UTC" as Unix seconds.
    today_start = datetime.combine(
        datetime.now(timezone.utc).date(),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )
    after_ts = int(today_start.timestamp())

    try:
        res = requests.get(
            STRAVA_ACTIVITIES_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"after": after_ts, "per_page": 10},
            timeout=10,
        )
        if res.status_code != 200:
            return {"error": f"strava_http_{res.status_code}"}
        activities = res.json() or []
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

    return {
        "athlete_id": athlete_id,
        "activities_today": len(activities),
        "refreshed_tokens": refreshed_tokens,
    }

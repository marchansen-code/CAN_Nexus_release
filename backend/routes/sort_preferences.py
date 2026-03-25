"""
User sort preferences routes for the CANUSA Knowledge Hub API.
Manages per-user article sorting within categories.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
from datetime import datetime, timezone

from database import db
from models import User, UserSortPreference, UserSortPreferenceUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/sort-preferences", tags=["Sort Preferences"])


@router.get("/{category_id}", response_model=Dict)
async def get_sort_preference(
    category_id: str,
    user: User = Depends(get_current_user)
):
    """Get the user's article sort order for a specific category."""
    preference = await db.user_sort_preferences.find_one(
        {"user_id": user.user_id, "category_id": category_id},
        {"_id": 0}
    )
    
    if not preference:
        return {"category_id": category_id, "article_order": [], "has_custom_order": False}
    
    return {
        "category_id": category_id,
        "article_order": preference.get("article_order", []),
        "has_custom_order": True
    }


@router.put("/{category_id}", response_model=Dict)
async def update_sort_preference(
    category_id: str,
    update: UserSortPreferenceUpdate,
    user: User = Depends(get_current_user)
):
    """Set or update the user's article sort order for a specific category."""
    # Check if preference exists
    existing = await db.user_sort_preferences.find_one(
        {"user_id": user.user_id, "category_id": category_id}
    )
    
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        # Update existing preference
        await db.user_sort_preferences.update_one(
            {"user_id": user.user_id, "category_id": category_id},
            {"$set": {
                "article_order": update.article_order,
                "updated_at": now
            }}
        )
    else:
        # Create new preference
        pref = UserSortPreference(
            user_id=user.user_id,
            category_id=category_id,
            article_order=update.article_order
        )
        doc = pref.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.user_sort_preferences.insert_one(doc)
    
    return {
        "message": "Sortierung gespeichert",
        "category_id": category_id,
        "article_order": update.article_order
    }


@router.delete("/{category_id}")
async def reset_sort_preference(
    category_id: str,
    user: User = Depends(get_current_user)
):
    """Reset the user's article sort order for a category (back to default)."""
    result = await db.user_sort_preferences.delete_one(
        {"user_id": user.user_id, "category_id": category_id}
    )
    
    if result.deleted_count == 0:
        return {"message": "Keine benutzerdefinierte Sortierung vorhanden"}
    
    return {"message": "Sortierung zurückgesetzt"}


@router.get("", response_model=Dict)
async def get_all_sort_preferences(
    user: User = Depends(get_current_user)
):
    """Get all sort preferences for the current user."""
    preferences = await db.user_sort_preferences.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Convert to a dict keyed by category_id for easier frontend use
    prefs_map = {p["category_id"]: p["article_order"] for p in preferences}
    
    return {"preferences": prefs_map}

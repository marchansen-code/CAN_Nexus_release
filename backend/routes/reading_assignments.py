"""
Reading assignments routes for CANUSA Nexus.
Manages article reading assignments to users and groups.
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from database import db
from models import User
from dependencies import get_current_user
from services.email_service import email_service

router = APIRouter(prefix="/reading-assignments", tags=["Reading Assignments"])


class ReadingAssignmentCreate(BaseModel):
    article_id: str
    user_ids: List[str] = []
    group_ids: List[str] = []


class MarkAsReadRequest(BaseModel):
    article_id: str


@router.post("")
async def create_reading_assignment(
    assignment: ReadingAssignmentCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """Create reading assignments for users/groups and send notifications."""
    # Get article
    article = await db.articles.find_one({"article_id": assignment.article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Artikel nicht gefunden")
    
    # Get requester info
    requester = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "name": 1})
    requester_name = requester.get("name", "Unbekannt") if requester else "Unbekannt"
    
    # Collect all user IDs (direct + from groups)
    all_user_ids = set(assignment.user_ids)
    
    # Add users from groups
    for group_id in assignment.group_ids:
        group_members = await db.users.find(
            {"group_ids": group_id},
            {"_id": 0, "user_id": 1}
        ).to_list(1000)
        for member in group_members:
            all_user_ids.add(member["user_id"])
    
    # Don't assign to the requester
    all_user_ids.discard(user.user_id)
    
    if not all_user_ids:
        return {"message": "Keine Benutzer zum Zuweisen gefunden", "assigned_count": 0}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update article with reading assignment info
    await db.articles.update_one(
        {"article_id": assignment.article_id},
        {"$set": {
            "reading_assignment_enabled": True,
            "reading_assignment_user_ids": assignment.user_ids,
            "reading_assignment_group_ids": assignment.group_ids,
            "reading_assignment_created_at": now,
            "reading_assignment_created_by": user.user_id
        }}
    )
    
    # Create reading status records for each user
    users_notified = []
    for target_user_id in all_user_ids:
        # Check if assignment already exists
        existing = await db.reading_status.find_one({
            "article_id": assignment.article_id,
            "user_id": target_user_id
        })
        
        if not existing:
            # Create new reading status (unread)
            await db.reading_status.insert_one({
                "article_id": assignment.article_id,
                "user_id": target_user_id,
                "assigned_by": user.user_id,
                "assigned_at": now,
                "is_read": False,
                "read_at": None
            })
            
            # Get user info for notification
            target_user = await db.users.find_one(
                {"user_id": target_user_id},
                {"_id": 0, "email": 1, "name": 1, "notification_preferences": 1}
            )
            
            if target_user:
                users_notified.append(target_user_id)
                
                # Check if user wants reading assignment notifications
                prefs = target_user.get("notification_preferences", {})
                if prefs.get("reading_assignments", True):
                    # Send email notification
                    background_tasks.add_task(
                        email_service.send_reading_assignment_notification,
                        target_user["email"],
                        target_user.get("name", "Kollege"),
                        requester_name,
                        article["title"],
                        assignment.article_id
                    )
    
    return {
        "message": f"Leseaufgabe an {len(users_notified)} Benutzer zugewiesen",
        "assigned_count": len(users_notified),
        "user_ids": list(all_user_ids)
    }


@router.delete("/{article_id}")
async def remove_reading_assignment(
    article_id: str,
    user: User = Depends(get_current_user)
):
    """Remove all reading assignments from an article."""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Artikel nicht gefunden")
    
    # Only author or admin can remove assignments
    if user.role != "admin" and article.get("created_by") != user.user_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    # Remove from article
    await db.articles.update_one(
        {"article_id": article_id},
        {"$set": {
            "reading_assignment_enabled": False,
            "reading_assignment_user_ids": [],
            "reading_assignment_group_ids": []
        }}
    )
    
    # Delete all reading status records for this article
    await db.reading_status.delete_many({"article_id": article_id})
    
    return {"message": "Leseaufgaben entfernt"}


@router.get("/my-assignments")
async def get_my_reading_assignments(user: User = Depends(get_current_user)):
    """Get all unread articles assigned to the current user."""
    # Get all unread assignments for this user
    assignments = await db.reading_status.find(
        {"user_id": user.user_id, "is_read": False},
        {"_id": 0}
    ).to_list(100)
    
    if not assignments:
        return {"assignments": []}
    
    # Get article details for each assignment
    article_ids = [a["article_id"] for a in assignments]
    articles = await db.articles.find(
        {"article_id": {"$in": article_ids}},
        {"_id": 0}
    ).to_list(100)
    
    # Create a map for quick lookup
    article_map = {a["article_id"]: a for a in articles}
    
    # Build response with assignment info
    result = []
    for assignment in assignments:
        article = article_map.get(assignment["article_id"])
        if article:
            # Get assigner name
            assigner = await db.users.find_one(
                {"user_id": assignment.get("assigned_by")},
                {"_id": 0, "name": 1}
            )
            
            result.append({
                **article,
                "assigned_at": assignment.get("assigned_at"),
                "assigned_by_name": assigner.get("name", "Unbekannt") if assigner else "Unbekannt"
            })
    
    # Sort by assigned_at descending (newest first)
    result.sort(key=lambda x: x.get("assigned_at", ""), reverse=True)
    
    return {"assignments": result}


@router.post("/mark-as-read")
async def mark_as_read(
    request: MarkAsReadRequest,
    user: User = Depends(get_current_user)
):
    """Mark an article as read by the current user."""
    result = await db.reading_status.update_one(
        {"article_id": request.article_id, "user_id": user.user_id},
        {"$set": {
            "is_read": True,
            "read_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Keine Leseaufgabe gefunden")
    
    return {"message": "Als gelesen markiert"}


@router.post("/mark-as-unread")
async def mark_as_unread(
    request: MarkAsReadRequest,
    user: User = Depends(get_current_user)
):
    """Mark an article as unread by the current user."""
    result = await db.reading_status.update_one(
        {"article_id": request.article_id, "user_id": user.user_id},
        {"$set": {
            "is_read": False,
            "read_at": None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Keine Leseaufgabe gefunden")
    
    return {"message": "Als ungelesen markiert"}


@router.get("/status/{article_id}")
async def get_reading_status(
    article_id: str,
    user: User = Depends(get_current_user)
):
    """Get reading status for a specific article for the current user."""
    status = await db.reading_status.find_one(
        {"article_id": article_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not status:
        return {"has_assignment": False, "is_read": None}
    
    return {
        "has_assignment": True,
        "is_read": status.get("is_read", False),
        "assigned_at": status.get("assigned_at"),
        "read_at": status.get("read_at")
    }


@router.get("/article/{article_id}/all-status")
async def get_all_reading_status(
    article_id: str,
    user: User = Depends(get_current_user)
):
    """Get reading status for all assigned users (for article author/admin)."""
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0, "created_by": 1})
    if not article:
        raise HTTPException(status_code=404, detail="Artikel nicht gefunden")
    
    # Only author or admin can see all statuses
    if user.role != "admin" and article.get("created_by") != user.user_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    statuses = await db.reading_status.find(
        {"article_id": article_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Enrich with user names
    result = []
    for status in statuses:
        user_doc = await db.users.find_one(
            {"user_id": status["user_id"]},
            {"_id": 0, "name": 1, "email": 1}
        )
        if user_doc:
            result.append({
                **status,
                "user_name": user_doc.get("name", "Unbekannt"),
                "user_email": user_doc.get("email")
            })
    
    return {"statuses": result}

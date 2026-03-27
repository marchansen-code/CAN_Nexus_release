"""
Recycle bin (Papierkorb) routes for the CANUSA Knowledge Hub API.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import os

from database import db
from models import User
from dependencies import get_current_user

router = APIRouter(prefix="/trash", tags=["Recycle Bin"])


@router.get("")
async def get_trash(user: User = Depends(get_current_user)):
    """Get all soft-deleted items (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können den Papierkorb sehen")
    
    # Get all users for lookup
    users_list = await db.users.find({}, {"_id": 0, "user_id": 1, "name": 1, "email": 1}).to_list(1000)
    users_dict = {u["user_id"]: u for u in users_list}
    
    def get_user_name(user_id):
        if not user_id:
            return "Unbekannt"
        user_data = users_dict.get(user_id)
        return user_data.get("name", user_data.get("email", "Unbekannt")) if user_data else "Unbekannt"
    
    # Get deleted articles
    deleted_articles = await db.articles.find(
        {"deleted_at": {"$exists": True}},
        {"_id": 0}
    ).sort("deleted_at", -1).to_list(100)
    
    # Get deleted documents
    deleted_documents = await db.documents.find(
        {"deleted_at": {"$exists": True}},
        {"_id": 0, "temp_path": 0}
    ).sort("deleted_at", -1).to_list(100)
    
    # Get deleted categories
    deleted_categories = await db.categories.find(
        {"deleted_at": {"$exists": True}},
        {"_id": 0}
    ).sort("deleted_at", -1).to_list(100)
    
    now = datetime.now(timezone.utc)
    
    # Process articles
    for art in deleted_articles:
        deleted_at = art.get("deleted_at")
        if deleted_at:
            if isinstance(deleted_at, str):
                deleted_at = datetime.fromisoformat(deleted_at.replace("Z", "+00:00"))
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            days_left = 30 - (now - deleted_at).days
            art["days_until_permanent_deletion"] = max(0, days_left)
        # Add deleted_by user name
        art["deleted_by_name"] = get_user_name(art.get("deleted_by"))
    
    # Process documents
    for doc in deleted_documents:
        deleted_at = doc.get("deleted_at")
        if deleted_at:
            if isinstance(deleted_at, str):
                deleted_at = datetime.fromisoformat(deleted_at.replace("Z", "+00:00"))
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            days_left = 30 - (now - deleted_at).days
            doc["days_until_permanent_deletion"] = max(0, days_left)
        # Add deleted_by user name
        doc["deleted_by_name"] = get_user_name(doc.get("deleted_by"))
    
    # Process categories
    for cat in deleted_categories:
        deleted_at = cat.get("deleted_at")
        if deleted_at:
            if isinstance(deleted_at, str):
                deleted_at = datetime.fromisoformat(deleted_at.replace("Z", "+00:00"))
            if deleted_at.tzinfo is None:
                deleted_at = deleted_at.replace(tzinfo=timezone.utc)
            days_left = 30 - (now - deleted_at).days
            cat["days_until_permanent_deletion"] = max(0, days_left)
        # Add deleted_by user name
        cat["deleted_by_name"] = get_user_name(cat.get("deleted_by"))
    
    return {
        "articles": deleted_articles,
        "documents": deleted_documents,
        "categories": deleted_categories
    }


@router.post("/restore/article/{article_id}")
async def restore_article(article_id: str, user: User = Depends(get_current_user)):
    """Restore a soft-deleted article (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können Artikel wiederherstellen")
    
    article = await db.articles.find_one({"article_id": article_id, "deleted_at": {"$exists": True}})
    if not article:
        raise HTTPException(status_code=404, detail="Artikel nicht im Papierkorb gefunden")
    
    await db.articles.update_one(
        {"article_id": article_id},
        {"$unset": {"deleted_at": "", "deleted_by": ""}}
    )
    return {"message": "Artikel wiederhergestellt"}


@router.post("/restore/document/{document_id}")
async def restore_document(document_id: str, user: User = Depends(get_current_user)):
    """Restore a soft-deleted document (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können Dokumente wiederherstellen")
    
    doc = await db.documents.find_one({"document_id": document_id, "deleted_at": {"$exists": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht im Papierkorb gefunden")
    
    await db.documents.update_one(
        {"document_id": document_id},
        {"$unset": {"deleted_at": "", "deleted_by": ""}}
    )
    return {"message": "Dokument wiederhergestellt"}


@router.post("/restore/category/{category_id}")
async def restore_category(category_id: str, user: User = Depends(get_current_user)):
    """Restore a soft-deleted category (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können Kategorien wiederherstellen")
    
    cat = await db.categories.find_one({"category_id": category_id, "deleted_at": {"$exists": True}})
    if not cat:
        raise HTTPException(status_code=404, detail="Kategorie nicht im Papierkorb gefunden")
    
    await db.categories.update_one(
        {"category_id": category_id},
        {"$unset": {"deleted_at": "", "deleted_by": ""}}
    )
    return {"message": "Kategorie wiederhergestellt"}


@router.delete("/permanent/article/{article_id}")
async def permanently_delete_article(article_id: str, user: User = Depends(get_current_user)):
    """Permanently delete an article (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können endgültig löschen")
    
    result = await db.articles.delete_one({"article_id": article_id, "deleted_at": {"$exists": True}})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artikel nicht im Papierkorb gefunden")
    return {"message": "Artikel endgültig gelöscht"}


@router.delete("/permanent/document/{document_id}")
async def permanently_delete_document(document_id: str, user: User = Depends(get_current_user)):
    """Permanently delete a document (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können endgültig löschen")
    
    doc = await db.documents.find_one({"document_id": document_id, "deleted_at": {"$exists": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht im Papierkorb gefunden")
    
    file_path = doc.get("file_path") or doc.get("temp_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
    
    await db.documents.delete_one({"document_id": document_id})
    return {"message": "Dokument endgültig gelöscht"}


@router.delete("/permanent/category/{category_id}")
async def permanently_delete_category(category_id: str, user: User = Depends(get_current_user)):
    """Permanently delete a category (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können endgültig löschen")
    
    result = await db.categories.delete_one({"category_id": category_id, "deleted_at": {"$exists": True}})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategorie nicht im Papierkorb gefunden")
    return {"message": "Kategorie endgültig gelöscht"}


@router.post("/cleanup")
async def cleanup_trash(user: User = Depends(get_current_user)):
    """Auto-delete items older than 30 days (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Administratoren können den Papierkorb aufräumen")
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    deleted_articles = await db.articles.delete_many({
        "deleted_at": {"$exists": True, "$lt": cutoff_date}
    })
    
    old_docs = await db.documents.find({
        "deleted_at": {"$exists": True, "$lt": cutoff_date}
    }).to_list(100)
    
    for doc in old_docs:
        file_path = doc.get("file_path") or doc.get("temp_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
    
    deleted_documents = await db.documents.delete_many({
        "deleted_at": {"$exists": True, "$lt": cutoff_date}
    })
    
    return {
        "message": "Papierkorb aufgeräumt",
        "deleted_articles": deleted_articles.deleted_count,
        "deleted_documents": deleted_documents.deleted_count
    }

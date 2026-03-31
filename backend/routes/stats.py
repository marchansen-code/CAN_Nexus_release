"""
Statistics, favorites, and activity routes for the CANUSA Knowledge Hub API.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List
from pydantic import BaseModel

from database import db
from models import User
from dependencies import get_current_user

router = APIRouter(tags=["Statistics"])

# In-memory storage for active editors
active_editors = {}


class DismissArticleRequest(BaseModel):
    article_ids: List[str]


@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get dashboard statistics."""
    total_articles = await db.articles.count_documents({})
    published_articles = await db.articles.count_documents({"status": "published"})
    draft_articles = await db.articles.count_documents({"status": "draft"})
    review_articles = await db.articles.count_documents({"status": "review"})
    total_categories = await db.categories.count_documents({})
    total_documents = await db.documents.count_documents({})
    pending_documents = await db.documents.count_documents({"status": "pending"})
    
    # For non-admins: exclude drafts created by other users
    if user.role != "admin":
        recent_articles = await db.articles.find(
            {"$or": [
                {"status": {"$ne": "draft"}},
                {"status": "draft", "created_by": user.user_id}
            ]},
            {"_id": 0}
        ).sort("updated_at", -1).limit(5).to_list(5)
    else:
        recent_articles = await db.articles.find({}, {"_id": 0}).sort("updated_at", -1).limit(5).to_list(5)
    top_articles = await db.articles.find({}, {"_id": 0}).sort("view_count", -1).limit(5).to_list(5)
    
    favorite_articles = await db.articles.find(
        {"favorited_by": user.user_id},
        {"_id": 0}
    ).sort("updated_at", -1).limit(5).to_list(5)
    
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "recently_viewed": 1})
    recently_viewed_ids = user_data.get("recently_viewed", [])[:15] if user_data else []
    recently_viewed = []
    if recently_viewed_ids:
        for article_id in recently_viewed_ids:
            article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
            if article:
                recently_viewed.append(article)
    
    user_articles_count = await db.articles.count_documents({"created_by": user.user_id})
    user_documents_count = await db.documents.count_documents({"uploaded_by": user.user_id})
    
    # Get articles with expiry date within 14 days (visible to all users)
    now = datetime.now(timezone.utc)
    expiry_threshold = now + timedelta(days=14)
    expiring_articles = await db.articles.find(
        {
            "expiry_date": {
                "$ne": None,
                "$lte": expiry_threshold.isoformat(),
                "$gt": now.isoformat()
            },
            "status": {"$ne": "draft"}
        },
        {"_id": 0}
    ).sort("expiry_date", 1).to_list(50)
    
    # Get already expired articles (visible to all users)
    dismissed_docs = await db.dismissed_expired_articles.find(
        {"user_id": user.user_id},
        {"article_id": 1}
    ).to_list(1000)
    dismissed_ids = [d.get("article_id") for d in dismissed_docs]
    
    expired_articles_query = {
        "expiry_date": {
            "$ne": None,
            "$lte": now.isoformat()
        },
        "status": {"$ne": "draft"},
        "deleted_at": {"$exists": False}
    }
    if dismissed_ids:
        expired_articles_query["article_id"] = {"$nin": dismissed_ids}
    
    expired_articles = await db.articles.find(
        expired_articles_query,
        {"_id": 0}
    ).sort("expiry_date", -1).to_list(50)
    
    # Calculate days expired for each article
    for article in expired_articles:
        if article.get("expiry_date"):
            try:
                expiry = datetime.fromisoformat(article["expiry_date"].replace("Z", "+00:00"))
                days_expired = (now - expiry).days
                article["days_expired"] = days_expired
            except Exception:
                article["days_expired"] = 0
    
    # Get user's own draft articles for "Meine Entwürfe" section
    my_drafts = await db.articles.find(
        {
            "created_by": user.user_id,
            "status": "draft",
            "deleted_at": {"$exists": False}
        },
        {"_id": 0}
    ).sort("updated_at", -1).to_list(20)
    
    return {
        "total_articles": total_articles,
        "published_articles": published_articles,
        "draft_articles": draft_articles,
        "review_articles": review_articles,
        "total_categories": total_categories,
        "total_documents": total_documents,
        "pending_documents": pending_documents,
        "recent_articles": recent_articles,
        "top_articles": top_articles,
        "favorite_articles": favorite_articles,
        "recently_viewed": recently_viewed,
        "expiring_articles": expiring_articles,
        "expired_articles": expired_articles,
        "my_drafts": my_drafts,
        "user_stats": {
            "articles_created": user_articles_count,
            "documents_uploaded": user_documents_count
        }
    }


@router.post("/stats/dismiss-expired")
async def dismiss_expired_articles(
    request: DismissArticleRequest,
    user: User = Depends(get_current_user)
):
    """Dismiss expired article notifications for the current user."""
    now = datetime.now(timezone.utc).isoformat()
    
    for article_id in request.article_ids:
        # Upsert to avoid duplicates
        await db.dismissed_expired_articles.update_one(
            {"user_id": user.user_id, "article_id": article_id},
            {"$set": {"dismissed_at": now}},
            upsert=True
        )
    
    return {"message": f"{len(request.article_ids)} Artikel ausgeblendet"}


@router.get("/favorites")
async def get_favorites(user: User = Depends(get_current_user)):
    """Get all favorite articles for current user."""
    articles = await db.articles.find(
        {"favorited_by": user.user_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return articles


@router.get("/tags")
async def get_all_tags(user: User = Depends(get_current_user)):
    """Get all unique tags from articles."""
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}}
    ]
    result = await db.articles.aggregate(pipeline).to_list(500)
    tags = [r["_id"] for r in result if r["_id"]]
    return {"tags": tags}

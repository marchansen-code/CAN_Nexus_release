"""
Widget routes for embedding CANUSA Nexus search on external websites.
Custom CORS handling for specific allowed origins.
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, Response, HTMLResponse
from typing import Optional
import re
import os

from pathlib import Path

from database import db

SUPPORTED_EXTENSIONS = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
DOCS_STORAGE_PATH = os.environ.get("DOCS_STORAGE_PATH", "/app/data/docs")

router = APIRouter(prefix="/widget", tags=["Widget"])

# Allowed origins for widget embedding
ALLOWED_ORIGINS = [
    "http://lil-explorer.com",
    "https://powerd.canusa.de",
    "https://cpv.canusa.de",
]

# Also allow the app's own origin for testing
APP_URL = os.environ.get("REACT_APP_BACKEND_URL", "")
if APP_URL:
    ALLOWED_ORIGINS.append(APP_URL)


def get_cors_headers(request: Request) -> dict:
    """Return CORS headers if origin is allowed, empty dict otherwise."""
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin",
        }
    return {}


def cors_response(request: Request, content: dict = None, status_code: int = 200):
    """Build a JSONResponse with CORS headers if origin is allowed."""
    headers = get_cors_headers(request)
    if content is None:
        return Response(status_code=200, headers=headers)
    return JSONResponse(content=content, status_code=status_code, headers=headers)


def strip_html(html_content: str) -> str:
    """Remove HTML tags from content."""
    if not html_content:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html_content)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&quot;', '"', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


async def build_category_breadcrumb(category_ids: list) -> str:
    """Build a breadcrumb string from category IDs."""
    if not category_ids:
        return ""
    parts = []
    for cid in category_ids[:3]:
        cat = await db.categories.find_one(
            {"category_id": cid, "deleted_at": {"$exists": False}},
            {"_id": 0, "name": 1, "parent_id": 1}
        )
        if cat:
            # Build path from root
            path = [cat["name"]]
            parent_id = cat.get("parent_id")
            depth = 0
            while parent_id and depth < 5:
                parent = await db.categories.find_one(
                    {"category_id": parent_id},
                    {"_id": 0, "name": 1, "parent_id": 1}
                )
                if parent:
                    path.insert(0, parent["name"])
                    parent_id = parent.get("parent_id")
                else:
                    break
                depth += 1
            parts.append(" > ".join(path))
    return " | ".join(parts) if parts else ""


# ==================== PREFLIGHT ====================

@router.options("/search")
async def widget_search_preflight(request: Request):
    return cors_response(request)


@router.options("/article/{article_id}")
async def widget_article_preflight(request: Request, article_id: str):
    return cors_response(request)


@router.options("/document/{document_id}/preview")
async def widget_document_preflight(request: Request, document_id: str):
    return cors_response(request)


@router.options("/document/{document_id}/file")
async def widget_document_file_preflight(request: Request, document_id: str):
    return cors_response(request)


# ==================== SEARCH ====================

@router.get("/search")
async def widget_search(request: Request, q: str = "", limit: int = 20):
    """Public search endpoint for the embeddable widget.
    Only returns published articles and completed documents."""
    if not q or len(q) < 2:
        return cors_response(request, {"articles": [], "documents": [], "query": q})

    search_terms = q.lower().split()

    # --- Search articles (published only) ---
    or_conditions = []
    for term in search_terms:
        or_conditions.extend([
            {"title": {"$regex": re.escape(term), "$options": "i"}},
            {"content": {"$regex": re.escape(term), "$options": "i"}},
            {"tags": {"$regex": re.escape(term), "$options": "i"}},
        ])

    article_query = {
        "status": "published",
        "deleted_at": {"$exists": False},
        "$or": or_conditions,
    }

    raw_articles = await db.articles.find(
        article_query, {"_id": 0}
    ).limit(limit * 2).to_list(limit * 2)

    articles = []
    for art in raw_articles:
        title_lower = art["title"].lower()
        content_lower = art.get("content", "").lower()
        tags_str = " ".join(art.get("tags", [])).lower()

        score = 0
        for term in search_terms:
            if term in title_lower:
                score += 0.5
            if term in content_lower:
                score += 0.1
            if term in tags_str:
                score += 0.3

        if score == 0:
            continue

        # Snippet
        content_text = strip_html(art.get("content", ""))
        snippet = ""
        for term in search_terms:
            idx = content_text.lower().find(term)
            if idx >= 0:
                start = max(0, idx - 60)
                end = min(len(content_text), idx + 140)
                snippet = ("..." if start > 0 else "") + content_text[start:end].strip() + "..."
                break
        if not snippet:
            snippet = content_text[:200] + ("..." if len(content_text) > 200 else "")

        breadcrumb = await build_category_breadcrumb(art.get("category_ids", []))

        articles.append({
            "article_id": art["article_id"],
            "title": art["title"],
            "snippet": snippet,
            "breadcrumb": breadcrumb,
            "tags": art.get("tags", []),
            "updated_at": art.get("updated_at"),
            "score": round(score, 2),
            "type": "article",
        })

    articles.sort(key=lambda x: x["score"], reverse=True)
    articles = articles[:limit]

    # --- Search documents (completed only) ---
    doc_or = []
    for term in search_terms:
        doc_or.extend([
            {"filename": {"$regex": re.escape(term), "$options": "i"}},
            {"extracted_text": {"$regex": re.escape(term), "$options": "i"}},
        ])

    doc_query = {
        "status": "completed",
        "deleted_at": {"$exists": False},
        "$or": doc_or,
    }

    raw_docs = await db.documents.find(
        doc_query, {"_id": 0, "html_content": 0, "extracted_text": 0}
    ).limit(limit).to_list(limit)

    documents = []
    for doc in raw_docs:
        documents.append({
            "document_id": doc["document_id"],
            "filename": doc.get("filename", ""),
            "file_type": doc.get("file_type", ""),
            "file_size": doc.get("file_size"),
            "created_at": doc.get("created_at"),
            "type": "document",
        })

    return cors_response(request, {
        "articles": articles,
        "documents": documents,
        "query": q,
    })


# ==================== ARTICLE CONTENT ====================

@router.get("/article/{article_id}")
async def widget_get_article(request: Request, article_id: str):
    """Get full article content for popup display. Published only."""
    article = await db.articles.find_one(
        {"article_id": article_id, "status": "published", "deleted_at": {"$exists": False}},
        {"_id": 0, "article_id": 1, "title": 1, "content": 1, "tags": 1,
         "category_ids": 1, "updated_at": 1, "created_at": 1, "created_by": 1}
    )
    if not article:
        return cors_response(request, {"detail": "Artikel nicht gefunden"}, 404)

    breadcrumb = await build_category_breadcrumb(article.get("category_ids", []))

    author_name = None
    if article.get("created_by"):
        author = await db.users.find_one(
            {"user_id": article["created_by"]}, {"_id": 0, "name": 1}
        )
        if author:
            author_name = author["name"]

    return cors_response(request, {
        "article_id": article["article_id"],
        "title": article["title"],
        "content": article.get("content", ""),
        "tags": article.get("tags", []),
        "breadcrumb": breadcrumb,
        "author": author_name,
        "updated_at": article.get("updated_at"),
    })


# ==================== DOCUMENT PREVIEW ====================

@router.get("/document/{document_id}/preview")
async def widget_get_document_preview(request: Request, document_id: str):
    """Get document preview data for popup display."""
    doc = await db.documents.find_one(
        {"document_id": document_id, "deleted_at": {"$exists": False}},
        {"_id": 0}
    )
    if not doc:
        return cors_response(request, {"detail": "Dokument nicht gefunden"}, 404)

    file_path = doc.get("file_path")
    has_file = bool(file_path and os.path.exists(file_path))

    result = {
        "document_id": doc["document_id"],
        "filename": doc.get("filename", ""),
        "file_type": doc.get("file_type", ""),
        "file_size": doc.get("file_size"),
        "has_file": has_file,
        "html_content": doc.get("html_content", ""),
        "extracted_text": doc.get("extracted_text", ""),
    }

    return cors_response(request, result)


# ==================== DOCUMENT FILE (public, for iframe) ====================

@router.get("/document/{document_id}/file")
async def widget_get_document_file(request: Request, document_id: str):
    """Serve the actual document file for inline viewing (iframe).
    Returns the raw file with correct Content-Type and CORS headers."""
    doc = await db.documents.find_one(
        {"document_id": document_id, "deleted_at": {"$exists": False}},
        {"_id": 0, "file_path": 1, "file_type": 1, "filename": 1}
    )
    if not doc:
        headers = get_cors_headers(request)
        return Response(status_code=404, headers=headers)

    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        headers = get_cors_headers(request)
        return Response(status_code=404, headers=headers)

    file_type = doc.get("file_type", ".pdf")
    media_type = SUPPORTED_EXTENSIONS.get(file_type, "application/octet-stream")
    filename = doc.get("filename", "document")

    with open(file_path, "rb") as f:
        content = f.read()

    headers = get_cors_headers(request)
    headers["Content-Disposition"] = f'inline; filename="{filename}"'

    return Response(content=content, media_type=media_type, headers=headers)


# ==================== EMBED SCRIPT ====================

@router.get("/embed.js")
async def widget_embed_js():
    """Serve the embeddable widget script with Access-Control-Allow-Origin: *."""
    js_path = Path(__file__).parent.parent / "static" / "widget" / "embed.js"
    if not js_path.exists():
        return Response("// embed.js not found", status_code=404, media_type="application/javascript")
    return Response(
        content=js_path.read_text(encoding="utf-8"),
        media_type="application/javascript",
        headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600"},
    )


# ==================== DEMO PAGE ====================

@router.get("/demo", response_class=HTMLResponse)
async def widget_demo():
    """Serve the widget demo page."""
    demo_path = Path(__file__).parent.parent / "static" / "widget" / "demo.html"
    if not demo_path.exists():
        return HTMLResponse("<h1>Demo page not found</h1>", status_code=404)
    return HTMLResponse(demo_path.read_text(encoding="utf-8"))

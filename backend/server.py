"""
CANUSA Nexus Knowledge Hub API
Main application entry point with route registration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import secrets
import os
from datetime import datetime, timezone
import uuid
import logging
from pathlib import Path

# Database and dependencies
from database import db, client, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_NAME
from dependencies import get_password_hash

# Route modules
from routes import auth, users, groups, categories, articles, search, documents, document_folders, recycle_bin, images, stats, backup, exports, versions, google_auth, google_drive, notifications, ocr, sort_preferences, reading_assignments, widget

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure auth failure logger for Fail2Ban
ROOT_DIR = Path(__file__).parent
auth_failure_handler = logging.FileHandler(ROOT_DIR / "auth_failures.log")
auth_failure_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
auth_logger = logging.getLogger("auth_failures")
auth_logger.addHandler(auth_failure_handler)
auth_logger.setLevel(logging.WARNING)

# Create FastAPI app
app = FastAPI(
    title="CANUSA Nexus API",
    description="Knowledge Management Platform for CANUSA",
    version="2.0.0"
)

# Include all routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(articles.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(document_folders.router, prefix="/api")
app.include_router(recycle_bin.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(versions.router, prefix="/api")
app.include_router(google_auth.router, prefix="/api")
app.include_router(google_drive.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(sort_preferences.router, prefix="/api")
app.include_router(reading_assignments.router, prefix="/api")
app.include_router(widget.router, prefix="/api")

# Static files for widget embedding
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Session middleware for OAuth (required by authlib)
app.add_middleware(SessionMiddleware, secret_key=secrets.token_urlsafe(32))

# CORS middleware
app_url = os.environ.get("APP_URL", "")
cors_origins = [app_url] if app_url else ["*"]
# Add widget embedding origins for preflight support
widget_origins = [
    "http://lil-explorer.com",
    "https://powerd.canusa.de",
    "https://cpv.canusa.de",
]
for wo in widget_origins:
    if wo not in cors_origins:
        cors_origins.append(wo)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/")
async def root():
    """API root endpoint."""
    return {"message": "CANUSA Knowledge Hub API", "version": "2.0.0"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint with environment status (for debugging)."""
    import os
    return {
        "status": "ok",
        "version": "2.0.0",
        "env_check": {
            "MONGO_URL": "configured" if os.environ.get("MONGO_URL") else "MISSING",
            "DB_NAME": os.environ.get("DB_NAME", "NOT SET"),
            "GOOGLE_CLIENT_ID": "configured" if os.environ.get("GOOGLE_CLIENT_ID") else "MISSING",
            "GOOGLE_CLIENT_SECRET": "configured" if os.environ.get("GOOGLE_CLIENT_SECRET") else "MISSING",
            "SMTP_SERVER": os.environ.get("SMTP_SERVER", "NOT SET"),
            "SMTP_USERNAME": os.environ.get("SMTP_USERNAME", "NOT SET"),
            "SMTP_PASSWORD": "configured" if os.environ.get("SMTP_PASSWORD") else "MISSING",
            "APP_URL": os.environ.get("APP_URL", "NOT SET"),
        }
    }


@app.on_event("startup")
async def startup():
    """Initialize database and create default admin."""
    # Create indexes
    await db.articles.create_index([("title", "text"), ("content", "text")])
    await db.articles.create_index("status")
    await db.articles.create_index("category_ids")
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.groups.create_index("name", unique=True)
    await db.article_versions.create_index([("article_id", 1), ("version_number", -1)])
    await db.user_sort_preferences.create_index([("user_id", 1), ("category_id", 1)], unique=True)
    await db.reading_status.create_index([("user_id", 1), ("is_read", 1)])
    await db.reading_status.create_index([("article_id", 1), ("user_id", 1)], unique=True)
    
    # Check for existing admin user
    admin_exists = await db.users.find_one({"email": DEFAULT_ADMIN_EMAIL})
    
    if admin_exists:
        if not admin_exists.get("password_hash"):
            logger.info(f"Migrating admin user {DEFAULT_ADMIN_EMAIL} to password auth...")
            await db.users.update_one(
                {"email": DEFAULT_ADMIN_EMAIL},
                {"$set": {
                    "password_hash": get_password_hash(DEFAULT_ADMIN_PASSWORD),
                    "role": "admin",
                    "is_blocked": False,
                    "group_ids": []
                }}
            )
            logger.info("Admin user migrated successfully")
    else:
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": DEFAULT_ADMIN_EMAIL,
            "name": DEFAULT_ADMIN_NAME,
            "password_hash": get_password_hash(DEFAULT_ADMIN_PASSWORD),
            "role": "admin",
            "is_blocked": False,
            "group_ids": [],
            "recently_viewed": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Default admin user created: {DEFAULT_ADMIN_EMAIL}")
    
    # Process expired articles and important markings
    await process_expirations()
    
    # Migration: Ensure all users have group_ids field
    users_without_groups = await db.users.count_documents({"group_ids": {"$exists": False}})
    if users_without_groups > 0:
        result = await db.users.update_many(
            {"group_ids": {"$exists": False}},
            {"$set": {"group_ids": []}}
        )
        logger.info(f"Migration: Added group_ids to {result.modified_count} users")
    
    # Migration: Move document files from /tmp/docs to persistent storage
    import shutil
    DOCS_STORAGE_PATH = os.environ.get("DOCS_STORAGE_PATH", "/app/data/docs")
    os.makedirs(DOCS_STORAGE_PATH, exist_ok=True)
    
    old_docs_path = "/tmp/docs"
    if os.path.exists(old_docs_path) and old_docs_path != DOCS_STORAGE_PATH:
        migrated = 0
        for filename in os.listdir(old_docs_path):
            old_file = os.path.join(old_docs_path, filename)
            new_file = os.path.join(DOCS_STORAGE_PATH, filename)
            if os.path.isfile(old_file) and not os.path.exists(new_file):
                shutil.copy2(old_file, new_file)
                migrated += 1
        if migrated > 0:
            logger.info(f"Migration: Copied {migrated} document files to persistent storage")
    
    # Update document records with new storage path
    docs_with_old_path = await db.documents.count_documents({"file_path": {"$regex": "^/tmp/docs/"}})
    if docs_with_old_path > 0:
        async for doc in db.documents.find({"file_path": {"$regex": "^/tmp/docs/"}}):
            old_path = doc["file_path"]
            new_path = old_path.replace("/tmp/docs/", f"{DOCS_STORAGE_PATH}/")
            await db.documents.update_one(
                {"document_id": doc["document_id"]},
                {"$set": {"file_path": new_path}}
            )
        logger.info(f"Migration: Updated {docs_with_old_path} document file paths")


async def process_expirations():
    """Check for expired articles and important markings."""
    now = datetime.now(timezone.utc).isoformat()
    
    expired = await db.articles.update_many(
        {
            "expiry_date": {"$lte": now, "$ne": None},
            "status": {"$ne": "draft"}
        },
        {"$set": {"status": "draft"}}
    )
    if expired.modified_count > 0:
        logger.info(f"Set {expired.modified_count} expired articles to draft")
    
    important_expired = await db.articles.update_many(
        {
            "important_until": {"$lte": now, "$ne": None},
            "is_important": True
        },
        {"$set": {"is_important": False, "important_until": None}}
    )
    if important_expired.modified_count > 0:
        logger.info(f"Removed important marking from {important_expired.modified_count} articles")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    client.close()

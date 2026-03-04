"""
Iteration 10: Test new Backup & Export features
1. GET /api/backup/preview - Database statistics (Admin only)
2. GET /api/backup/export - Export backup as JSON (Admin only)
3. POST /api/backup/import - Import backup from JSON (Admin only)
4. GET /api/articles/{id}/export/pdf - Export article as PDF
5. GET /api/articles/{id}/export/docx - Export article as Word document
"""
import pytest
import requests
import os
import json
from datetime import datetime
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "marc.hansen@canusa.de"
ADMIN_PASSWORD = "CanusaNexus2024!"

# Test user prefix for cleanup
TEST_PREFIX = "TEST_iter10_"

# Test article ID from problem statement
TEST_ARTICLE_ID = "art_e9bdb744726e"


@pytest.fixture(scope="module")
def admin_session():
    """Login as admin and return session"""
    session = requests.Session()
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "stay_logged_in": False
        }
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return session


@pytest.fixture(scope="module")
def viewer_session(admin_session):
    """Create a viewer user and return session"""
    # Create viewer user
    test_email = f"{TEST_PREFIX}viewer_{uuid.uuid4().hex[:8]}@test.de"
    create_response = admin_session.post(
        f"{BASE_URL}/api/users",
        json={
            "email": test_email,
            "password": "ViewerPass123!",
            "name": "Test Viewer",
            "role": "viewer"
        }
    )
    
    if create_response.status_code != 200:
        pytest.skip("Could not create viewer user for testing")
    
    user_id = create_response.json()["user_id"]
    
    # Login as viewer
    viewer_session = requests.Session()
    login_response = viewer_session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": test_email,
            "password": "ViewerPass123!",
            "stay_logged_in": False
        }
    )
    
    if login_response.status_code != 200:
        admin_session.delete(f"{BASE_URL}/api/users/{user_id}")
        pytest.skip("Could not login as viewer for testing")
    
    yield viewer_session
    
    # Cleanup
    admin_session.delete(f"{BASE_URL}/api/users/{user_id}")


@pytest.fixture
def test_article_id(admin_session):
    """Create a test article and return its ID, cleanup after test"""
    response = admin_session.post(
        f"{BASE_URL}/api/articles",
        json={
            "title": f"{TEST_PREFIX}Export Test Article",
            "content": "<h1>Test Heading</h1><p>This is a test article for PDF and Word export testing.</p><ul><li>Point 1</li><li>Point 2</li></ul>",
            "summary": "Ein Testartikel für den Export",
            "status": "published",
            "tags": ["test", "export"]
        }
    )
    
    if response.status_code != 200:
        pytest.skip("Could not create test article")
    
    article_id = response.json()["article_id"]
    yield article_id
    
    # Cleanup
    admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


# ==================== BACKUP PREVIEW TESTS ====================

class TestBackupPreview:
    """Tests for GET /api/backup/preview - Database statistics"""
    
    def test_preview_as_admin(self, admin_session):
        """Test getting backup preview as admin"""
        response = admin_session.get(f"{BASE_URL}/api/backup/preview")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check all expected fields
        assert "articles" in data, "Response should contain articles count"
        assert "categories" in data, "Response should contain categories count"
        assert "users" in data, "Response should contain users count"
        assert "documents" in data, "Response should contain documents count"
        
        # Values should be integers >= 0
        assert isinstance(data["articles"], int), "Articles count should be integer"
        assert isinstance(data["categories"], int), "Categories count should be integer"
        assert isinstance(data["users"], int), "Users count should be integer"
        assert isinstance(data["documents"], int), "Documents count should be integer"
        
        assert data["articles"] >= 0, "Articles count should be >= 0"
        assert data["users"] >= 1, "Should have at least 1 user (admin)"
    
    def test_preview_as_viewer_forbidden(self, viewer_session):
        """Test that viewer cannot access backup preview"""
        response = viewer_session.get(f"{BASE_URL}/api/backup/preview")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
    
    def test_preview_without_auth(self):
        """Test backup preview requires authentication"""
        response = requests.get(f"{BASE_URL}/api/backup/preview")
        
        assert response.status_code == 401


# ==================== BACKUP EXPORT TESTS ====================

class TestBackupExport:
    """Tests for GET /api/backup/export - Export backup as JSON"""
    
    def test_export_as_admin(self, admin_session):
        """Test exporting backup as admin"""
        response = admin_session.get(f"{BASE_URL}/api/backup/export")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'application/json' in content_type, f"Expected JSON content type, got {content_type}"
        
        # Check Content-Disposition header for download
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, "Should be an attachment download"
        assert 'canusa_nexus_backup' in content_disp, "Filename should contain 'canusa_nexus_backup'"
        
        # Parse and validate JSON structure
        data = response.json()
        
        assert "version" in data, "Backup should contain version"
        assert "created_at" in data, "Backup should contain created_at"
        assert "created_by" in data, "Backup should contain created_by"
        assert "statistics" in data, "Backup should contain statistics"
        assert "data" in data, "Backup should contain data"
        
        # Validate statistics
        stats = data["statistics"]
        assert "articles" in stats
        assert "categories" in stats
        assert "users" in stats
        
        # Validate data structure
        backup_data = data["data"]
        assert "articles" in backup_data
        assert "categories" in backup_data
        assert "users" in backup_data
        
        # Users should NOT contain password_hash
        for user in backup_data["users"]:
            assert "password_hash" not in user, "Backup should not contain password hashes"
        
        # Verify created_by is admin email
        assert data["created_by"] == ADMIN_EMAIL
    
    def test_export_as_viewer_forbidden(self, viewer_session):
        """Test that viewer cannot export backup"""
        response = viewer_session.get(f"{BASE_URL}/api/backup/export")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_export_without_auth(self):
        """Test backup export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        
        assert response.status_code == 401


# ==================== BACKUP IMPORT TESTS ====================

class TestBackupImport:
    """Tests for POST /api/backup/import - Import backup from JSON"""
    
    def test_import_with_valid_backup_merge_mode(self, admin_session):
        """Test importing backup in merge mode (existing data kept)"""
        # Create a valid backup structure with test data
        backup_data = {
            "version": "2.0.0",
            "created_at": datetime.now().isoformat(),
            "created_by": "test@test.de",
            "statistics": {
                "articles": 1,
                "categories": 1,
                "users": 1
            },
            "data": {
                "articles": [
                    {
                        "article_id": f"art_{TEST_PREFIX}{uuid.uuid4().hex[:8]}",
                        "title": f"{TEST_PREFIX}Imported Article",
                        "content": "Test content for imported article",
                        "summary": "Test summary",
                        "status": "draft",
                        "visibility": "all",
                        "tags": ["imported"],
                        "favorited_by": [],
                        "created_by": "import_test",
                        "updated_by": "import_test",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                        "view_count": 0
                    }
                ],
                "categories": [
                    {
                        "category_id": f"cat_{TEST_PREFIX}{uuid.uuid4().hex[:8]}",
                        "name": f"{TEST_PREFIX}Imported Category",
                        "parent_id": None,
                        "description": "Test category",
                        "order": 0,
                        "created_by": "import_test",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                ],
                "users": []  # Not importing users in this test
            }
        }
        
        response = admin_session.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": backup_data,
                "import_articles": True,
                "import_categories": True,
                "import_users": False,
                "merge_mode": True
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data, "Response should contain message"
        assert "results" in data, "Response should contain results"
        
        results = data["results"]
        assert "articles" in results
        assert "categories" in results
        
        # In merge mode, should import new items
        assert results["articles"]["imported"] >= 0
        assert results["categories"]["imported"] >= 0
        
        # Cleanup imported data
        article_id = backup_data["data"]["articles"][0]["article_id"]
        category_id = backup_data["data"]["categories"][0]["category_id"]
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")
        admin_session.delete(f"{BASE_URL}/api/categories/{category_id}")
    
    def test_import_invalid_format(self, admin_session):
        """Test importing invalid backup format fails"""
        response = admin_session.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": {"invalid": "format"},  # Missing 'data' key
                "import_articles": True,
                "import_categories": True,
                "import_users": True,
                "merge_mode": True
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
    
    def test_import_as_viewer_forbidden(self, viewer_session):
        """Test that viewer cannot import backup"""
        response = viewer_session.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": {"data": {}},
                "import_articles": True,
                "import_categories": True,
                "import_users": True,
                "merge_mode": True
            }
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_import_without_auth(self):
        """Test backup import requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": {"data": {}},
                "import_articles": True,
                "import_categories": True,
                "import_users": True,
                "merge_mode": True
            }
        )
        
        assert response.status_code == 401
    
    def test_import_user_with_temp_password(self, admin_session):
        """Test that imported users get temporary password"""
        test_user_id = f"user_{TEST_PREFIX}{uuid.uuid4().hex[:8]}"
        test_user_email = f"{TEST_PREFIX}importeduser_{uuid.uuid4().hex[:8]}@test.de"
        
        backup_data = {
            "version": "2.0.0",
            "created_at": datetime.now().isoformat(),
            "created_by": "test@test.de",
            "statistics": {"articles": 0, "categories": 0, "users": 1},
            "data": {
                "articles": [],
                "categories": [],
                "users": [
                    {
                        "user_id": test_user_id,
                        "email": test_user_email,
                        "name": "Imported User",
                        "role": "viewer",
                        "is_blocked": False,
                        "created_at": datetime.now().isoformat()
                    }
                ]
            }
        }
        
        response = admin_session.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": backup_data,
                "import_articles": False,
                "import_categories": False,
                "import_users": True,
                "merge_mode": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check note about temp password
        assert "note" in data, "Should contain note about temp password"
        assert "TempPassword123!" in data["note"]
        
        # Verify user can login with temp password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_user_email,
                "password": "TempPassword123!",
                "stay_logged_in": False
            }
        )
        
        assert login_response.status_code == 200, "Imported user should be able to login with temp password"
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/users/{test_user_id}")


# ==================== PDF EXPORT TESTS ====================

class TestPDFExport:
    """Tests for GET /api/articles/{id}/export/pdf - Export article as PDF"""
    
    def test_export_pdf_existing_article(self, admin_session, test_article_id):
        """Test exporting an existing article as PDF"""
        response = admin_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/pdf")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'application/pdf' in content_type, f"Expected PDF content type, got {content_type}"
        
        # Check Content-Disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, "Should be an attachment download"
        assert '.pdf' in content_disp, "Filename should have .pdf extension"
        
        # Verify it's actually PDF content (PDF magic bytes)
        content = response.content
        assert len(content) > 0, "PDF content should not be empty"
        assert content[:4] == b'%PDF', f"Content should start with PDF magic bytes, got {content[:4]}"
    
    def test_export_pdf_with_provided_article(self, admin_session):
        """Test exporting the test article ID from problem statement"""
        response = admin_session.get(f"{BASE_URL}/api/articles/{TEST_ARTICLE_ID}/export/pdf")
        
        # Could be 404 if article doesn't exist, or 200 if it does
        if response.status_code == 404:
            pytest.skip(f"Test article {TEST_ARTICLE_ID} not found in database")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert 'application/pdf' in response.headers.get('Content-Type', '')
    
    def test_export_pdf_nonexistent_article(self, admin_session):
        """Test exporting PDF for non-existent article returns 404"""
        response = admin_session.get(f"{BASE_URL}/api/articles/nonexistent_article_id/export/pdf")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_export_pdf_requires_auth(self):
        """Test PDF export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/articles/{TEST_ARTICLE_ID}/export/pdf")
        
        assert response.status_code == 401
    
    def test_export_pdf_as_viewer(self, viewer_session, test_article_id):
        """Test that viewers can also export PDF (not admin-only)"""
        response = viewer_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/pdf")
        
        assert response.status_code == 200, "Viewers should be able to export PDF"
        assert 'application/pdf' in response.headers.get('Content-Type', '')


# ==================== DOCX EXPORT TESTS ====================

class TestDocxExport:
    """Tests for GET /api/articles/{id}/export/docx - Export article as Word document"""
    
    def test_export_docx_existing_article(self, admin_session, test_article_id):
        """Test exporting an existing article as DOCX"""
        response = admin_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/docx")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type, \
            f"Expected DOCX content type, got {content_type}"
        
        # Check Content-Disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, "Should be an attachment download"
        assert '.docx' in content_disp, "Filename should have .docx extension"
        
        # Verify it's actually DOCX content (ZIP magic bytes - DOCX is a ZIP file)
        content = response.content
        assert len(content) > 0, "DOCX content should not be empty"
        # DOCX files start with ZIP magic bytes
        assert content[:2] == b'PK', f"Content should start with ZIP magic bytes (PK), got {content[:4]}"
    
    def test_export_docx_with_provided_article(self, admin_session):
        """Test exporting the test article ID from problem statement"""
        response = admin_session.get(f"{BASE_URL}/api/articles/{TEST_ARTICLE_ID}/export/docx")
        
        # Could be 404 if article doesn't exist, or 200 if it does
        if response.status_code == 404:
            pytest.skip(f"Test article {TEST_ARTICLE_ID} not found in database")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert 'wordprocessingml.document' in response.headers.get('Content-Type', '')
    
    def test_export_docx_nonexistent_article(self, admin_session):
        """Test exporting DOCX for non-existent article returns 404"""
        response = admin_session.get(f"{BASE_URL}/api/articles/nonexistent_article_id/export/docx")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_export_docx_requires_auth(self):
        """Test DOCX export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/articles/{TEST_ARTICLE_ID}/export/docx")
        
        assert response.status_code == 401
    
    def test_export_docx_as_viewer(self, viewer_session, test_article_id):
        """Test that viewers can also export DOCX (not admin-only)"""
        response = viewer_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/docx")
        
        assert response.status_code == 200, "Viewers should be able to export DOCX"
        assert 'wordprocessingml.document' in response.headers.get('Content-Type', '')


# ==================== END-TO-END TESTS ====================

class TestBackupWorkflow:
    """End-to-end tests for backup workflow"""
    
    def test_full_backup_export_import_cycle(self, admin_session):
        """Test creating backup, then importing it back"""
        # Get initial stats
        preview_before = admin_session.get(f"{BASE_URL}/api/backup/preview").json()
        
        # Export backup
        export_response = admin_session.get(f"{BASE_URL}/api/backup/export")
        assert export_response.status_code == 200
        
        backup_data = export_response.json()
        
        # Verify backup contains data matching preview
        assert backup_data["statistics"]["articles"] == preview_before["articles"]
        assert backup_data["statistics"]["users"] == preview_before["users"]
        
        # Import the same backup in merge mode (should skip existing)
        import_response = admin_session.post(
            f"{BASE_URL}/api/backup/import",
            json={
                "backup_data": backup_data,
                "import_articles": True,
                "import_categories": True,
                "import_users": True,
                "merge_mode": True  # Merge mode: skip existing
            }
        )
        
        assert import_response.status_code == 200
        import_results = import_response.json()["results"]
        
        # In merge mode with same data, everything should be skipped
        assert import_results["articles"]["skipped"] == backup_data["statistics"]["articles"]
        assert import_results["categories"]["skipped"] == backup_data["statistics"]["categories"]


class TestExportFormats:
    """Test article export format correctness"""
    
    def test_export_both_formats_same_article(self, admin_session, test_article_id):
        """Test exporting same article in both PDF and DOCX"""
        # Export PDF
        pdf_response = admin_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/pdf")
        assert pdf_response.status_code == 200
        
        # Export DOCX
        docx_response = admin_session.get(f"{BASE_URL}/api/articles/{test_article_id}/export/docx")
        assert docx_response.status_code == 200
        
        # Both should have different content types
        assert 'application/pdf' in pdf_response.headers.get('Content-Type', '')
        assert 'wordprocessingml.document' in docx_response.headers.get('Content-Type', '')
        
        # Both should have content
        assert len(pdf_response.content) > 100, "PDF should have substantial content"
        assert len(docx_response.content) > 100, "DOCX should have substantial content"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

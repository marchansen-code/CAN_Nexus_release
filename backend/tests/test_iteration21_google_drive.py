"""
Iteration 21: Google Drive Integration Tests
Tests for Google Drive connection, status, and article export endpoints.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def session():
    """Create authenticated session."""
    s = requests.Session()
    response = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": "marc.hansen@canusa.de",
        "password": "CanusaNexus2024!"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return s


class TestGoogleDriveStatus:
    """Tests for Google Drive status endpoint."""
    
    def test_drive_status_returns_connection_state(self, session):
        """Test /api/drive/status returns connection status."""
        response = session.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)
    
    def test_drive_status_requires_auth(self):
        """Test /api/drive/status requires authentication."""
        s = requests.Session()
        response = s.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 401 or "Sitzung nicht gefunden" in response.text


class TestGoogleDriveConnect:
    """Tests for Google Drive connect endpoint."""
    
    def test_drive_connect_returns_authorization_url(self, session):
        """Test /api/drive/connect returns OAuth authorization URL."""
        response = session.get(f"{BASE_URL}/api/drive/connect")
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        url = data["authorization_url"]
        # Verify it points to Google OAuth
        assert "accounts.google.com" in url
        assert "client_id" in url
        assert "redirect_uri" in url
        assert "drive.file" in url  # Check for drive.file scope
    
    def test_drive_connect_includes_callback_uri(self, session):
        """Test /api/drive/connect redirect_uri points to our callback."""
        response = session.get(f"{BASE_URL}/api/drive/connect")
        assert response.status_code == 200
        data = response.json()
        url = data["authorization_url"]
        assert "api%2Fdrive%2Fcallback" in url or "api/drive/callback" in url
    
    def test_drive_connect_requires_auth(self):
        """Test /api/drive/connect requires authentication."""
        s = requests.Session()
        response = s.get(f"{BASE_URL}/api/drive/connect")
        assert response.status_code == 401 or "Sitzung nicht gefunden" in response.text


class TestGoogleDriveFiles:
    """Tests for Google Drive files/folders endpoints when not connected."""
    
    def test_drive_files_when_not_connected(self, session):
        """Test /api/drive/files returns error when Drive not connected."""
        # First check if not connected
        status_resp = session.get(f"{BASE_URL}/api/drive/status")
        if status_resp.json().get("connected"):
            pytest.skip("Drive is connected, skipping not-connected test")
        
        response = session.get(f"{BASE_URL}/api/drive/files")
        assert response.status_code == 400
        assert "nicht verbunden" in response.json().get("detail", "").lower() or "verbinden" in response.json().get("detail", "").lower()
    
    def test_drive_folders_when_not_connected(self, session):
        """Test /api/drive/folders returns error when Drive not connected."""
        status_resp = session.get(f"{BASE_URL}/api/drive/status")
        if status_resp.json().get("connected"):
            pytest.skip("Drive is connected, skipping not-connected test")
        
        response = session.get(f"{BASE_URL}/api/drive/folders")
        assert response.status_code == 400


class TestGoogleDriveExport:
    """Tests for Google Drive export to Drive endpoint."""
    
    def test_drive_export_when_not_connected(self, session):
        """Test export to Drive returns error when not connected."""
        status_resp = session.get(f"{BASE_URL}/api/drive/status")
        if status_resp.json().get("connected"):
            pytest.skip("Drive is connected, skipping not-connected test")
        
        # Get first article
        articles_resp = session.get(f"{BASE_URL}/api/articles")
        articles = articles_resp.json()
        if not articles:
            pytest.skip("No articles available for testing")
        
        article_id = articles[0]["article_id"]
        
        # Try to export - should fail because Drive not connected
        response = session.post(
            f"{BASE_URL}/api/drive/export/article/{article_id}",
            params={"format": "pdf", "folder_id": "root"}
        )
        assert response.status_code == 400


class TestArticleExport:
    """Tests for standard article export (PDF/DOCX)."""
    
    def test_export_pdf_works(self, session):
        """Test /api/articles/{id}/export/pdf returns PDF."""
        # Get first article
        articles_resp = session.get(f"{BASE_URL}/api/articles")
        articles = articles_resp.json()
        if not articles:
            pytest.skip("No articles available for testing")
        
        article_id = articles[0]["article_id"]
        
        response = session.get(f"{BASE_URL}/api/articles/{article_id}/export/pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        # Check for PDF header in content
        content = response.content
        assert content[:4] == b'%PDF', "Response should be a valid PDF"
    
    def test_export_docx_works(self, session):
        """Test /api/articles/{id}/export/docx returns DOCX."""
        # Get first article
        articles_resp = session.get(f"{BASE_URL}/api/articles")
        articles = articles_resp.json()
        if not articles:
            pytest.skip("No articles available for testing")
        
        article_id = articles[0]["article_id"]
        
        response = session.get(f"{BASE_URL}/api/articles/{article_id}/export/docx")
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "application/vnd.openxmlformats" in content_type or "officedocument" in content_type
        # Check for ZIP header (DOCX files are ZIP archives)
        content = response.content
        assert content[:2] == b'PK', "Response should be a valid DOCX (ZIP archive)"
    
    def test_export_pdf_requires_auth(self):
        """Test PDF export requires authentication."""
        s = requests.Session()
        response = s.get(f"{BASE_URL}/api/articles/art_invalid/export/pdf")
        assert response.status_code == 401 or "Sitzung" in response.text
    
    def test_export_nonexistent_article(self, session):
        """Test export of nonexistent article returns 404."""
        response = session.get(f"{BASE_URL}/api/articles/art_nonexistent/export/pdf")
        assert response.status_code == 404


class TestDocumentUpload:
    """Tests for standard document upload (not Drive)."""
    
    def test_document_upload_endpoint_exists(self, session):
        """Test document upload endpoint is available."""
        # Just verify endpoint exists - don't actually upload
        response = session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_document_folders_endpoint_works(self, session):
        """Test document folders endpoint works."""
        response = session.get(f"{BASE_URL}/api/document-folders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

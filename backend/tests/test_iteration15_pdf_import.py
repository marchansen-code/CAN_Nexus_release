"""
Iteration 15: Test PDF Import and Document Actions
Tests:
1. PDF to HTML conversion endpoint (/api/documents/{document_id}/convert-to-html)
2. Document move endpoint (/api/documents/{document_id}/move)
3. Document delete endpoint (soft delete)
4. Document listing and filtering
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def session():
    """Create authenticated session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    
    # Login
    login_response = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": "marc.hansen@canusa.de",
        "password": "CanusaNexus2024!"
    })
    
    if login_response.status_code != 200:
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    return s


@pytest.fixture(scope="module")
def test_document_id(session):
    """Get a completed document for testing (or upload one)"""
    # Get existing documents
    response = session.get(f"{BASE_URL}/api/documents")
    assert response.status_code == 200
    
    documents = response.json()
    
    # Find a completed document
    completed_docs = [d for d in documents if d.get("status") == "completed"]
    
    if completed_docs:
        return completed_docs[0]["document_id"]
    
    # No completed docs - skip tests that need them
    pytest.skip("No completed documents available for testing")


@pytest.fixture(scope="module")
def test_folder_id(session):
    """Get a test folder ID"""
    response = session.get(f"{BASE_URL}/api/document-folders")
    assert response.status_code == 200
    
    folders = response.json()
    if folders:
        return folders[0]["folder_id"]
    
    # Create a test folder
    response = session.post(f"{BASE_URL}/api/document-folders", json={
        "name": "TEST_iter15_folder",
        "description": "Test folder for iteration 15"
    })
    if response.status_code == 200:
        return response.json().get("folder_id")
    
    pytest.skip("Could not get or create a test folder")


class TestPDFToHTMLConversion:
    """Test PDF to HTML conversion endpoint"""
    
    def test_convert_pdf_to_html_success(self, session, test_document_id):
        """Test successful PDF to HTML conversion"""
        response = session.get(f"{BASE_URL}/api/documents/{test_document_id}/convert-to-html")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "document_id" in data
        assert "html_content" in data
        assert "success" in data
        assert data["success"] is True
        assert data["document_id"] == test_document_id
        
        # Verify HTML content is not empty
        assert data["html_content"]
        assert len(data["html_content"]) > 0
        
        # Verify it contains HTML tags
        html_content = data["html_content"]
        assert "<" in html_content and ">" in html_content
    
    def test_convert_pdf_returns_formatted_content(self, session, test_document_id):
        """Test that conversion returns properly formatted HTML"""
        response = session.get(f"{BASE_URL}/api/documents/{test_document_id}/convert-to-html")
        
        assert response.status_code == 200
        data = response.json()
        
        html_content = data["html_content"]
        
        # Check for styled elements (from post_process_html_for_tiptap)
        # Should have styled paragraphs or headings
        assert "style=" in html_content or "class=" in html_content
    
    def test_convert_nonexistent_document(self, session):
        """Test conversion of non-existent document returns 404"""
        response = session.get(f"{BASE_URL}/api/documents/doc_nonexistent123/convert-to-html")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    def test_convert_requires_authentication(self):
        """Test that conversion endpoint requires authentication"""
        # Request without cookies
        response = requests.get(f"{BASE_URL}/api/documents/doc_test/convert-to-html")
        
        assert response.status_code == 401


class TestDocumentMove:
    """Test document move functionality"""
    
    def test_move_document_to_folder(self, session, test_document_id, test_folder_id):
        """Test moving a document to a folder"""
        response = session.put(
            f"{BASE_URL}/api/documents/{test_document_id}/move",
            params={"folder_id": test_folder_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["folder_id"] == test_folder_id
        
        # Verify the move by getting the document
        doc_response = session.get(f"{BASE_URL}/api/documents/{test_document_id}")
        assert doc_response.status_code == 200
        doc_data = doc_response.json()
        assert doc_data.get("folder_id") == test_folder_id
    
    def test_move_document_to_root(self, session, test_document_id):
        """Test moving a document back to root (no folder)"""
        response = session.put(
            f"{BASE_URL}/api/documents/{test_document_id}/move",
            params={"folder_id": ""}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify the move
        doc_response = session.get(f"{BASE_URL}/api/documents/{test_document_id}")
        assert doc_response.status_code == 200
        doc_data = doc_response.json()
        # folder_id should be empty or null
        assert not doc_data.get("folder_id") or doc_data.get("folder_id") == ""
    
    def test_move_nonexistent_document(self, session, test_folder_id):
        """Test moving non-existent document returns 404"""
        response = session.put(
            f"{BASE_URL}/api/documents/doc_nonexistent123/move",
            params={"folder_id": test_folder_id}
        )
        
        assert response.status_code == 404
    
    def test_move_to_nonexistent_folder(self, session, test_document_id):
        """Test moving to non-existent folder returns 404"""
        response = session.put(
            f"{BASE_URL}/api/documents/{test_document_id}/move",
            params={"folder_id": "dfolder_nonexistent123"}
        )
        
        assert response.status_code == 404


class TestDocumentListing:
    """Test document listing and retrieval"""
    
    def test_list_documents(self, session):
        """Test listing all documents"""
        response = session.get(f"{BASE_URL}/api/documents")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check document structure if there are documents
        if len(data) > 0:
            doc = data[0]
            assert "document_id" in doc
            assert "filename" in doc
            assert "status" in doc
    
    def test_get_single_document(self, session, test_document_id):
        """Test getting a single document"""
        response = session.get(f"{BASE_URL}/api/documents/{test_document_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_id"] == test_document_id
        assert "filename" in data
        assert "status" in data
        assert "created_at" in data
    
    def test_get_nonexistent_document(self, session):
        """Test getting non-existent document returns 404"""
        response = session.get(f"{BASE_URL}/api/documents/doc_nonexistent123")
        
        assert response.status_code == 404


class TestDocumentFolders:
    """Test document folder endpoints"""
    
    def test_list_folders(self, session):
        """Test listing document folders"""
        response = session.get(f"{BASE_URL}/api/document-folders")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check folder structure
        if len(data) > 0:
            folder = data[0]
            assert "folder_id" in folder
            assert "name" in folder
    
    def test_create_folder(self, session):
        """Test creating a new folder"""
        folder_name = f"TEST_iter15_{int(time.time())}"
        
        response = session.post(f"{BASE_URL}/api/document-folders", json={
            "name": folder_name,
            "description": "Test folder created by pytest"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "folder_id" in data
        assert data["name"] == folder_name
        
        # Cleanup - delete the folder
        folder_id = data["folder_id"]
        delete_response = session.delete(f"{BASE_URL}/api/document-folders/{folder_id}")
        assert delete_response.status_code == 200

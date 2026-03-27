"""
Test iteration 38: Verify bug fixes for:
1. User group_ids migration - all users should have group_ids field
2. Document storage path - files should be saved to /app/data/docs/
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserGroupIds:
    """Test that all users have group_ids field after migration"""
    
    @pytest.fixture
    def auth_session(self):
        """Login as admin and get session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_users_returns_group_ids(self, auth_session):
        """GET /api/users should return all users with group_ids field"""
        response = auth_session.get(f"{BASE_URL}/api/users")
        
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json()
        
        assert isinstance(users, list), "Response should be a list of users"
        assert len(users) > 0, "Should have at least one user"
        
        # Check that all users have group_ids field
        users_without_group_ids = []
        for user in users:
            if "group_ids" not in user:
                users_without_group_ids.append(user.get("email", user.get("user_id", "unknown")))
            else:
                # Verify group_ids is an array
                assert isinstance(user["group_ids"], list), f"group_ids should be array for user {user.get('email')}"
        
        assert len(users_without_group_ids) == 0, f"Users missing group_ids: {users_without_group_ids}"
        print(f"✓ All {len(users)} users have group_ids field")


class TestDocumentStoragePath:
    """Test that documents are stored in persistent path /app/data/docs/"""
    
    @pytest.fixture
    def auth_session(self):
        """Login as admin and get session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_upload_document_saves_to_persistent_path(self, auth_session):
        """Upload a document and verify it's saved to /app/data/docs/"""
        # Create a small test file
        test_content = b"This is a test document for iteration 38 testing."
        files = {
            "file": ("TEST_iteration38_doc.txt", test_content, "text/plain")
        }
        data = {
            "target_language": "de",
            "force": "true"  # Force overwrite if exists
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/documents/upload",
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        
        document_id = result.get("document_id")
        assert document_id, "Response should contain document_id"
        
        print(f"✓ Document uploaded with ID: {document_id}")
        
        # Verify the file exists in /app/data/docs/
        expected_path = f"/app/data/docs/{document_id}.txt"
        assert os.path.exists(expected_path), f"File should exist at {expected_path}"
        
        # Verify file content
        with open(expected_path, 'rb') as f:
            saved_content = f.read()
        assert saved_content == test_content, "Saved content should match uploaded content"
        
        print(f"✓ File saved to persistent path: {expected_path}")
        
        # Cleanup: Delete the test document
        delete_response = auth_session.delete(f"{BASE_URL}/api/documents/{document_id}")
        print(f"Cleanup: Delete response status: {delete_response.status_code}")
    
    def test_document_file_path_not_in_tmp(self, auth_session):
        """Verify document records don't have /tmp/docs/ paths"""
        response = auth_session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200, f"Failed to get documents: {response.text}"
        
        documents = response.json()
        if isinstance(documents, dict):
            documents = documents.get("documents", [])
        
        docs_with_tmp_path = []
        for doc in documents:
            file_path = doc.get("file_path", "")
            if file_path.startswith("/tmp/docs/"):
                docs_with_tmp_path.append({
                    "document_id": doc.get("document_id"),
                    "filename": doc.get("filename"),
                    "file_path": file_path
                })
        
        assert len(docs_with_tmp_path) == 0, f"Documents with /tmp/docs/ path: {docs_with_tmp_path}"
        print(f"✓ No documents have /tmp/docs/ path (checked {len(documents)} documents)")


class TestAuthEndpoints:
    """Basic auth endpoint tests"""
    
    def test_login_success(self):
        """Test admin login works"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        assert data["role"] == "admin", "User should be admin"
        
        # Verify session cookie was set
        assert "session_token" in session.cookies, "Session cookie should be set"
        print(f"✓ Admin login successful, session cookie set")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Should return 401 for invalid credentials, got {response.status_code}"
        print(f"✓ Invalid credentials correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

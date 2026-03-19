"""
Iteration 23: Editor Improvements Backend Tests
- Multi-image upload API (POST /api/images/upload-multiple)
- Automatic 'Bilder' folder creation
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMultiImageUploadAPI:
    """Test the multi-image upload endpoint."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login to get session cookie."""
        self.session = requests.Session()
        
        # Login as admin - session token is set as cookie
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        yield
        
        # Cleanup if needed
    
    def _create_test_image(self, filename="test_image.png", size=(100, 100)):
        """Create a simple test image in memory."""
        # Create a minimal valid PNG file (1x1 red pixel)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk header
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # Width=1, Height=1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # Bit depth=8, RGB
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,  # Image data
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,  # CRC
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82                     # IEND CRC
        ])
        return io.BytesIO(png_data)
    
    def test_upload_multiple_images_success(self):
        """Test uploading multiple images successfully."""
        # Create test images
        files = [
            ('files', ('test_iter23_1.png', self._create_test_image(), 'image/png')),
            ('files', ('test_iter23_2.png', self._create_test_image(), 'image/png')),
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=true",
            files=files
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "uploaded" in data
        assert "errors" in data
        assert "total" in data
        assert "success_count" in data
        assert "error_count" in data
        
        # Should have uploaded 2 images
        assert data["total"] == 2
        assert data["success_count"] == 2
        assert data["error_count"] == 0
        assert len(data["uploaded"]) == 2
        
        # Each uploaded image should have required fields
        for img in data["uploaded"]:
            assert "image_id" in img
            assert "url" in img
            assert "filename" in img
            assert img["url"].startswith("/api/images/")
    
    def test_upload_multiple_creates_bilder_folder(self):
        """Test that uploading images creates 'Bilder' folder automatically."""
        files = [
            ('files', ('test_iter23_folder.png', self._create_test_image(), 'image/png')),
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=true",
            files=files
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Should have a folder_id when save_to_documents is true
        assert "folder_id" in data
        assert data["folder_id"] is not None
        assert data["folder_id"].startswith("dfolder_")
        
        # Verify the 'Bilder' folder exists in document folders
        folders_response = self.session.get(f"{BASE_URL}/api/document-folders")
        
        assert folders_response.status_code == 200, f"Failed to get folders: {folders_response.status_code}"
        folders = folders_response.json()
        
        bilder_folder = next((f for f in folders if f.get("name") == "Bilder"), None)
        assert bilder_folder is not None, "'Bilder' folder was not created"
    
    def test_upload_multiple_without_documents(self):
        """Test uploading images without saving to documents."""
        files = [
            ('files', ('test_iter23_nodoc.png', self._create_test_image(), 'image/png')),
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=false",
            files=files
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success_count"] == 1
        # folder_id should be None when not saving to documents
        assert data.get("folder_id") is None
    
    def test_upload_invalid_file_type(self):
        """Test that invalid file types are rejected."""
        # Create a text file instead of image
        text_content = io.BytesIO(b"This is not an image")
        
        files = [
            ('files', ('test.txt', text_content, 'text/plain')),
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=true",
            files=files
        )
        
        assert response.status_code == 200  # Endpoint returns 200 with errors array
        
        data = response.json()
        assert data["error_count"] == 1
        assert data["success_count"] == 0
        assert len(data["errors"]) == 1
        assert "test.txt" in data["errors"][0]["filename"]
    
    def test_upload_mixed_valid_invalid(self):
        """Test uploading mix of valid and invalid files."""
        text_content = io.BytesIO(b"This is not an image")
        
        files = [
            ('files', ('valid_image.png', self._create_test_image(), 'image/png')),
            ('files', ('invalid.txt', text_content, 'text/plain')),
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=true",
            files=files
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 2
        assert data["success_count"] == 1
        assert data["error_count"] == 1
    
    def test_upload_requires_authentication(self):
        """Test that upload requires authentication."""
        files = [
            ('files', ('test.png', self._create_test_image(), 'image/png')),
        ]
        
        # Use new session without auth
        response = requests.post(
            f"{BASE_URL}/api/images/upload-multiple?save_to_documents=true",
            files=files
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestSingleImageUpload:
    """Test the single image upload endpoint still works."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login to get session cookie."""
        self.session = requests.Session()
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        yield
    
    def _create_test_image(self):
        """Create a minimal test PNG."""
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        return io.BytesIO(png_data)
    
    def test_single_image_upload(self):
        """Test single image upload endpoint."""
        files = {'file': ('single_test.png', self._create_test_image(), 'image/png')}
        
        response = self.session.post(
            f"{BASE_URL}/api/images/upload",
            files=files
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "image_id" in data
        assert "url" in data
        assert data["url"].startswith("/api/images/")


class TestImageRetrieval:
    """Test image retrieval after upload."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login."""
        self.session = requests.Session()
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - skipping tests")
        
        yield
    
    def _create_test_image(self):
        """Create a minimal test PNG."""
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        return io.BytesIO(png_data)
    
    def test_retrieve_uploaded_image(self):
        """Test that uploaded images can be retrieved."""
        # Upload an image first
        files = {'file': ('retrieve_test.png', self._create_test_image(), 'image/png')}
        
        upload_response = self.session.post(
            f"{BASE_URL}/api/images/upload",
            files=files
        )
        
        assert upload_response.status_code == 200
        
        image_id = upload_response.json()["image_id"]
        
        # Retrieve the image (no auth needed for image retrieval)
        get_response = requests.get(f"{BASE_URL}/api/images/{image_id}")
        
        assert get_response.status_code == 200
        assert get_response.headers.get("Content-Type") in ["image/png", "image/jpeg", "image/gif", "image/webp"]
    
    def test_retrieve_nonexistent_image(self):
        """Test retrieving non-existent image returns 404."""
        response = requests.get(f"{BASE_URL}/api/images/img_nonexistent123")
        
        assert response.status_code == 404

"""
Iteration 29: Testing Pinnwand Category Containers, Quick Search (Ctrl+K), and OCR with Tesseract

Features to test:
1. Pinnwand: Each category has its own container with title from second word
2. Pinnwand: Articles displayed as single-line rows
3. Quick Search: Ctrl+K opens search dialog
4. Quick Search: Search finds articles by title
5. OCR: /api/ocr/status returns available=true with Tesseract provider
6. OCR: OCR button appears for PDF documents
7. OCR: OCR extracts text from PDF with confidence score
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthentication:
    """Test authentication and get session token"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_cookies(self, session):
        """Login and get auth cookies"""
        login_data = {
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        }
        response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session.cookies
    
    def test_login_success(self, session, auth_cookies):
        """Verify login works"""
        assert auth_cookies is not None
        print("✓ Login successful")


class TestOCRService:
    """Test OCR service with Tesseract"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login
        login_data = {
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        }
        response = s.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_ocr_status_available(self, session):
        """Test OCR status endpoint returns available=true with Tesseract"""
        response = session.get(f"{BASE_URL}/api/ocr/status")
        assert response.status_code == 200, f"OCR status failed: {response.text}"
        
        data = response.json()
        assert "available" in data, "Response should have 'available' field"
        assert data["available"] == True, "OCR should be available"
        assert "provider" in data, "Response should have 'provider' field"
        assert "Tesseract" in data["provider"], f"Provider should be Tesseract, got: {data['provider']}"
        assert "languages" in data, "Response should have 'languages' field"
        
        print(f"✓ OCR status: available={data['available']}, provider={data['provider']}")
        print(f"  Languages: {data['languages']}")
    
    def test_ocr_status_has_message(self, session):
        """Test OCR status has informative message"""
        response = session.get(f"{BASE_URL}/api/ocr/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data, "Response should have 'message' field"
        print(f"✓ OCR message: {data['message']}")


class TestQuickSearchAPI:
    """Test Quick Search API endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login
        login_data = {
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        }
        response = s.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_articles_search_endpoint_exists(self, session):
        """Test /api/articles/search endpoint exists"""
        response = session.get(f"{BASE_URL}/api/articles/search?q=test&limit=5")
        assert response.status_code == 200, f"Search endpoint failed: {response.text}"
        
        data = response.json()
        assert "articles" in data, "Response should have 'articles' field"
        print(f"✓ Articles search endpoint works, found {len(data['articles'])} results")
    
    def test_articles_search_with_query(self, session):
        """Test search returns articles matching query"""
        # First create a test article
        article_data = {
            "title": "TEST_QuickSearch_Article_29",
            "content": "<p>This is a test article for quick search testing</p>",
            "status": "published",
            "category_ids": [],
            "tags": ["test"]
        }
        create_response = session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert create_response.status_code == 200, f"Create article failed: {create_response.text}"
        article_id = create_response.json().get("article_id")
        
        try:
            # Search for the article
            response = session.get(f"{BASE_URL}/api/articles/search?q=QuickSearch_Article_29&limit=10")
            assert response.status_code == 200
            
            data = response.json()
            articles = data.get("articles", [])
            
            # Check if our test article is in results
            found = any(a.get("title") == "TEST_QuickSearch_Article_29" for a in articles)
            assert found, "Test article should be found in search results"
            print(f"✓ Search found test article in results")
            
        finally:
            # Cleanup
            if article_id:
                session.delete(f"{BASE_URL}/api/articles/{article_id}")
    
    def test_documents_search_endpoint(self, session):
        """Test documents search endpoint for quick search"""
        response = session.get(f"{BASE_URL}/api/documents?search=test&limit=5")
        assert response.status_code == 200, f"Documents search failed: {response.text}"
        print(f"✓ Documents search endpoint works")
    
    def test_categories_endpoint_for_search(self, session):
        """Test categories endpoint used by quick search"""
        response = session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Categories endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Categories should return a list"
        print(f"✓ Categories endpoint works, found {len(data)} categories")


class TestPinnwandCategories:
    """Test Pinnwand category containers and article display"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login
        login_data = {
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        }
        response = s.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_pinnwand_articles_endpoint(self, session):
        """Test /api/categories/pinnwand/articles endpoint"""
        response = session.get(f"{BASE_URL}/api/categories/pinnwand/articles")
        assert response.status_code == 200, f"Pinnwand articles failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list of articles"
        print(f"✓ Pinnwand articles endpoint works, found {len(data)} articles")
    
    def test_categories_have_is_pinnwand_field(self, session):
        """Test categories have is_pinnwand field"""
        response = session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            # Check if categories have is_pinnwand field
            has_pinnwand_field = any("is_pinnwand" in cat for cat in data)
            print(f"✓ Categories have is_pinnwand field: {has_pinnwand_field}")
            
            # Count pinnwand categories
            pinnwand_cats = [c for c in data if c.get("is_pinnwand")]
            print(f"  Found {len(pinnwand_cats)} Pinnwand categories")
    
    def test_create_pinnwand_category_and_article(self, session):
        """Test creating a Pinnwand category and article"""
        # Create a Pinnwand category
        category_data = {
            "name": "Pinnwand TEST_NEWS",
            "description": "Test Pinnwand category for iteration 29",
            "is_pinnwand": True
        }
        cat_response = session.post(f"{BASE_URL}/api/categories", json=category_data)
        assert cat_response.status_code == 200, f"Create category failed: {cat_response.text}"
        category = cat_response.json()
        category_id = category.get("category_id")
        
        try:
            # Verify category has is_pinnwand=true
            assert category.get("is_pinnwand") == True, "Category should have is_pinnwand=true"
            
            # Create an article in this category
            article_data = {
                "title": "TEST_Pinnwand_Article_29",
                "content": "<p>Test article for Pinnwand display</p>",
                "status": "published",
                "category_ids": [category_id],
                "tags": ["test", "pinnwand"]
            }
            art_response = session.post(f"{BASE_URL}/api/articles", json=article_data)
            assert art_response.status_code == 200, f"Create article failed: {art_response.text}"
            article = art_response.json()
            article_id = article.get("article_id")
            
            try:
                # Verify article appears in pinnwand articles
                pinnwand_response = session.get(f"{BASE_URL}/api/categories/pinnwand/articles")
                assert pinnwand_response.status_code == 200
                
                pinnwand_articles = pinnwand_response.json()
                found = any(a.get("article_id") == article_id for a in pinnwand_articles)
                assert found, "Article should appear in Pinnwand articles"
                print(f"✓ Pinnwand article created and found in Pinnwand articles list")
                
            finally:
                # Cleanup article
                session.delete(f"{BASE_URL}/api/articles/{article_id}")
                
        finally:
            # Cleanup category
            session.delete(f"{BASE_URL}/api/categories/{category_id}")
    
    def test_pinnwand_category_name_format(self, session):
        """Test Pinnwand category name format (second word extraction)"""
        # Create categories with different name formats
        test_cases = [
            ("Pinnwand NEWS", "NEWS"),
            ("Pinnwand SPECIALS", "SPECIALS"),
            ("Pinnwand Wichtige Infos", "Wichtige Infos"),
        ]
        
        created_ids = []
        try:
            for full_name, expected_title in test_cases:
                category_data = {
                    "name": f"TEST_{full_name}",
                    "description": "Test category",
                    "is_pinnwand": True
                }
                response = session.post(f"{BASE_URL}/api/categories", json=category_data)
                if response.status_code == 200:
                    cat = response.json()
                    created_ids.append(cat.get("category_id"))
                    
                    # Verify the name is stored correctly
                    name = cat.get("name", "")
                    # Extract second word (what frontend does)
                    parts = name.replace("TEST_", "").split(' ')
                    extracted_title = ' '.join(parts[1:]) if len(parts) > 1 else name
                    
                    print(f"✓ Category '{name}' -> Title would be '{extracted_title}'")
                    
        finally:
            # Cleanup
            for cat_id in created_ids:
                session.delete(f"{BASE_URL}/api/categories/{cat_id}")


class TestStatsEndpoint:
    """Test stats endpoint used by Dashboard"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login
        login_data = {
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        }
        response = s.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return s
    
    def test_stats_endpoint(self, session):
        """Test /api/stats endpoint for Dashboard"""
        response = session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        # Check expected fields
        expected_fields = ["total_articles", "published_articles", "total_categories", "total_documents"]
        for field in expected_fields:
            assert field in data, f"Stats should have '{field}' field"
        
        print(f"✓ Stats endpoint works:")
        print(f"  - Total articles: {data.get('total_articles')}")
        print(f"  - Published: {data.get('published_articles')}")
        print(f"  - Categories: {data.get('total_categories')}")
        print(f"  - Documents: {data.get('total_documents')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

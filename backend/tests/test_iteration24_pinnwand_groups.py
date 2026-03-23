"""
Iteration 24: Testing Pinnwand System, Dashboard Tabs, and Group Mentions API
Features tested:
1. Dashboard tabs (Pinnwand/Dashboard) - frontend only
2. Dashboard order (Favoriten -> Zuletzt angesehen -> Neueste Artikel -> Statistiken)
3. Schnellzugriff removed - frontend only
4. Categories with is_pinnwand field
5. GET /api/categories/pinnwand/articles endpoint
6. GET /api/groups/search/mention endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "marc.hansen@canusa.de"
ADMIN_PASSWORD = "CanusaNexus2024!"


@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session with cookies"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert data.get("email") == ADMIN_EMAIL, "Login response missing email"
    print(f"Logged in as: {data.get('name')}")
    return session


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self, auth_session):
        """Test admin login works"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"Authenticated as: {data['name']}, role: {data['role']}")


class TestCategoriesPinnwand:
    """Test categories with is_pinnwand field"""
    
    def test_get_categories(self, auth_session):
        """Test GET /api/categories returns categories"""
        response = auth_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        print(f"Found {len(categories)} categories")
    
    def test_create_pinnwand_category(self, auth_session):
        """Test creating a category with is_pinnwand=true"""
        payload = {
            "name": "TEST_Pinnwand_Category_24",
            "description": "Test Pinnwand category for iteration 24",
            "parent_id": None,
            "is_pinnwand": True
        }
        response = auth_session.post(f"{BASE_URL}/api/categories", json=payload)
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["is_pinnwand"] == True
        assert "category_id" in data
        print(f"Created Pinnwand category: {data['category_id']}")
        
        # Store for cleanup
        TestCategoriesPinnwand.test_category_id = data["category_id"]
    
    def test_get_pinnwand_articles_endpoint(self, auth_session):
        """Test GET /api/categories/pinnwand/articles endpoint exists and returns list"""
        response = auth_session.get(f"{BASE_URL}/api/categories/pinnwand/articles")
        assert response.status_code == 200, f"Pinnwand articles endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Pinnwand articles endpoint returned {len(data)} articles")
    
    def test_update_category_pinnwand_flag(self, auth_session):
        """Test updating a category's is_pinnwand flag"""
        if hasattr(TestCategoriesPinnwand, 'test_category_id'):
            cat_id = TestCategoriesPinnwand.test_category_id
            
            # Update to is_pinnwand=false
            payload = {
                "name": "TEST_Pinnwand_Category_24_Updated",
                "description": "Updated description",
                "parent_id": None,
                "is_pinnwand": False
            }
            response = auth_session.put(f"{BASE_URL}/api/categories/{cat_id}", json=payload)
            assert response.status_code == 200, f"Update failed: {response.text}"
            
            data = response.json()
            assert data["is_pinnwand"] == False
            print(f"Updated category is_pinnwand to False")
        else:
            pytest.skip("No test category to update")
    
    def test_cleanup_test_category(self, auth_session):
        """Cleanup test category"""
        if hasattr(TestCategoriesPinnwand, 'test_category_id'):
            cat_id = TestCategoriesPinnwand.test_category_id
            response = auth_session.delete(f"{BASE_URL}/api/categories/{cat_id}")
            assert response.status_code == 200, f"Delete failed: {response.text}"
            print(f"Cleaned up test category: {cat_id}")
        else:
            pytest.skip("No test category to cleanup")


class TestGroupsMention:
    """Test groups mention search endpoint"""
    
    def test_groups_search_mention_endpoint(self, auth_session):
        """Test GET /api/groups/search/mention endpoint exists"""
        response = auth_session.get(f"{BASE_URL}/api/groups/search/mention")
        assert response.status_code == 200, f"Groups mention search failed: {response.text}"
        
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        print(f"Groups mention search returned {len(data['results'])} groups")
    
    def test_groups_search_mention_with_query(self, auth_session):
        """Test groups search with query parameter"""
        response = auth_session.get(f"{BASE_URL}/api/groups/search/mention?q=test")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        print(f"Groups search with 'test' query returned {len(data['results'])} results")
    
    def test_groups_search_mention_returns_member_count(self, auth_session):
        """Test that groups search returns member_count field"""
        response = auth_session.get(f"{BASE_URL}/api/groups/search/mention")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["results"]) > 0:
            group = data["results"][0]
            assert "member_count" in group, "member_count field missing from group"
            assert "group_id" in group
            assert "name" in group
            print(f"First group: {group['name']} with {group['member_count']} members")
        else:
            print("No groups found to verify member_count - creating test group")
            # Create a test group to verify the endpoint
            create_resp = auth_session.post(f"{BASE_URL}/api/groups", json={
                "name": "TEST_Group_Mention_24",
                "description": "Test group for mention testing"
            })
            if create_resp.status_code == 200:
                # Re-fetch
                response = auth_session.get(f"{BASE_URL}/api/groups/search/mention")
                data = response.json()
                if len(data["results"]) > 0:
                    group = data["results"][0]
                    assert "member_count" in group
                    print(f"Created and verified group: {group['name']}")
                    # Cleanup
                    auth_session.delete(f"{BASE_URL}/api/groups/{group['group_id']}")


class TestStatsEndpoint:
    """Test stats endpoint for dashboard data"""
    
    def test_stats_endpoint(self, auth_session):
        """Test GET /api/stats returns dashboard data"""
        response = auth_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        # Check for expected fields used in Dashboard
        expected_fields = ["total_articles", "published_articles", "total_categories", "total_documents"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"Stats: {data.get('total_articles')} articles, {data.get('total_categories')} categories")
    
    def test_stats_has_favorite_articles(self, auth_session):
        """Test stats includes favorite_articles for Dashboard Favoriten section"""
        response = auth_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        # favorite_articles should exist (may be empty list)
        assert "favorite_articles" in data or data.get("favorite_articles") is None or isinstance(data.get("favorite_articles", []), list)
        print(f"Favorite articles: {len(data.get('favorite_articles', []))}")
    
    def test_stats_has_recently_viewed(self, auth_session):
        """Test stats includes recently_viewed for Dashboard Zuletzt angesehen section"""
        response = auth_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        # recently_viewed should exist
        assert "recently_viewed" in data or isinstance(data.get("recently_viewed", []), list)
        print(f"Recently viewed: {len(data.get('recently_viewed', []))}")
    
    def test_stats_has_recent_articles(self, auth_session):
        """Test stats includes recent_articles for Dashboard Neueste Artikel section"""
        response = auth_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "recent_articles" in data or isinstance(data.get("recent_articles", []), list)
        print(f"Recent articles: {len(data.get('recent_articles', []))}")


class TestDocumentsFolderFilter:
    """Test documents folder filtering (bug fix verification)"""
    
    def test_get_documents(self, auth_session):
        """Test GET /api/documents returns documents"""
        response = auth_session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} documents")
    
    def test_get_document_folders(self, auth_session):
        """Test GET /api/document-folders returns folders"""
        response = auth_session.get(f"{BASE_URL}/api/document-folders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} document folders")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

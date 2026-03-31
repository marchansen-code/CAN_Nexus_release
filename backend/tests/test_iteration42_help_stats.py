"""
Iteration 42: Test Help page feature and stats visibility fix
- Help page: /help route accessible for all roles
- Stats API: expiring_articles and expired_articles filter by author OR edit permissions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
ADMIN_EMAIL = "marc.hansen@canusa.de"
ADMIN_PASSWORD = "CanusaNexus2024!"
EDITOR_EMAIL = "editor.test@canusa.de"
EDITOR_PASSWORD = "Test1234!"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        # Login returns user data directly (not nested under "user" key)
        assert data.get("role") == "admin"
        print(f"✓ Admin login successful: {data.get('name')}")
    
    def test_editor_login(self):
        """Test editor login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        # Login returns user data directly (not nested under "user" key)
        assert data.get("role") == "editor"
        print(f"✓ Editor login successful: {data.get('name')}")


class TestStatsAPIVisibility:
    """Test stats API visibility filter for expiring/expired articles"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    @pytest.fixture
    def editor_session(self):
        """Get authenticated editor session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Editor login failed")
        return session
    
    def test_stats_endpoint_returns_expected_fields(self, admin_session):
        """Test that /api/stats returns all expected fields including expiring/expired articles"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check all expected fields are present
        expected_fields = [
            "total_articles", "published_articles", "draft_articles", "review_articles",
            "total_categories", "total_documents", "pending_documents",
            "recent_articles", "top_articles", "favorite_articles", "recently_viewed",
            "expiring_articles", "expired_articles", "my_drafts", "user_stats"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Stats API returns all {len(expected_fields)} expected fields")
        print(f"  - expiring_articles count: {len(data.get('expiring_articles', []))}")
        print(f"  - expired_articles count: {len(data.get('expired_articles', []))}")
        print(f"  - my_drafts count: {len(data.get('my_drafts', []))}")
    
    def test_stats_expiring_articles_structure(self, admin_session):
        """Test expiring_articles field structure"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # expiring_articles should be a list
        assert isinstance(data.get("expiring_articles"), list)
        
        # If there are expiring articles, check structure
        if data["expiring_articles"]:
            article = data["expiring_articles"][0]
            assert "article_id" in article
            assert "title" in article
            assert "expiry_date" in article
            print(f"✓ expiring_articles has correct structure, first article: {article.get('title', 'N/A')}")
        else:
            print("✓ expiring_articles is empty (no articles expiring within 14 days)")
    
    def test_stats_expired_articles_structure(self, admin_session):
        """Test expired_articles field structure"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # expired_articles should be a list
        assert isinstance(data.get("expired_articles"), list)
        
        # If there are expired articles, check structure
        if data["expired_articles"]:
            article = data["expired_articles"][0]
            assert "article_id" in article
            assert "title" in article
            assert "expiry_date" in article
            # days_expired should be calculated
            assert "days_expired" in article
            print(f"✓ expired_articles has correct structure, first article: {article.get('title', 'N/A')}, days_expired: {article.get('days_expired')}")
        else:
            print("✓ expired_articles is empty (no expired articles)")
    
    def test_stats_my_drafts_field(self, admin_session):
        """Test my_drafts field returns user's own drafts"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # my_drafts should be a list
        assert isinstance(data.get("my_drafts"), list)
        print(f"✓ my_drafts count: {len(data.get('my_drafts', []))}")
        
        # If there are drafts, verify they are drafts
        for draft in data.get("my_drafts", []):
            assert draft.get("status") == "draft", f"Expected draft status, got: {draft.get('status')}"
    
    def test_editor_stats_access(self, editor_session):
        """Test that editor can access stats endpoint"""
        response = editor_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Editor should also get all fields
        assert "expiring_articles" in data
        assert "expired_articles" in data
        assert "my_drafts" in data
        print(f"✓ Editor can access stats API")
        print(f"  - Editor's expiring_articles count: {len(data.get('expiring_articles', []))}")
        print(f"  - Editor's expired_articles count: {len(data.get('expired_articles', []))}")
        print(f"  - Editor's my_drafts count: {len(data.get('my_drafts', []))}")


class TestFavoritesAndPinnwand:
    """Test favorites and pinnwand features still work"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_favorites_endpoint(self, admin_session):
        """Test /api/favorites endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/favorites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Favorites endpoint working, count: {len(data)}")
    
    def test_pinnwand_endpoint(self, admin_session):
        """Test /api/categories/pinnwand/articles endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/categories/pinnwand/articles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Pinnwand endpoint working, count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

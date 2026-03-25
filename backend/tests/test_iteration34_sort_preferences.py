"""
Iteration 34: Test Sort Preferences API for per-user article sorting
Tests the new drag & drop article reordering feature within categories.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "marc.hansen@canusa.de"
ADMIN_PASSWORD = "CanusaNexus2024!"
EDITOR_EMAIL = "editor.test@canusa.de"
EDITOR_PASSWORD = "Test1234!"


class TestSortPreferencesAPI:
    """Test suite for /api/sort-preferences endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_auth_token(self, email, password):
        """Helper to get authentication token from cookie"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            # Token is set as a cookie, extract it
            session_token = response.cookies.get("session_token")
            return session_token
        return None
    
    def get_categories(self, token):
        """Helper to get categories"""
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/categories", headers=headers)
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_articles_in_category(self, token, category_id):
        """Helper to get articles in a category"""
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/articles", headers=headers)
        if response.status_code == 200:
            articles = response.json()
            return [a for a in articles if category_id in (a.get('category_ids') or [])]
        return []
    
    # ==================== GET /api/sort-preferences ====================
    
    def test_get_all_sort_preferences_admin(self):
        """Test GET /api/sort-preferences returns all user preferences (admin)"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/sort-preferences", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "preferences" in data, "Response should contain 'preferences' key"
        assert isinstance(data["preferences"], dict), "Preferences should be a dict"
        print(f"✓ GET /api/sort-preferences returned {len(data['preferences'])} preferences")
    
    def test_get_all_sort_preferences_editor(self):
        """Test GET /api/sort-preferences works for editor role"""
        token = self.get_auth_token(EDITOR_EMAIL, EDITOR_PASSWORD)
        assert token, "Editor login failed"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/sort-preferences", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "preferences" in data
        print(f"✓ Editor can access sort preferences")
    
    def test_get_all_sort_preferences_unauthenticated(self):
        """Test GET /api/sort-preferences requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/sort-preferences")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated request correctly rejected with {response.status_code}")
    
    # ==================== GET /api/sort-preferences/{category_id} ====================
    
    def test_get_sort_preference_for_category_no_custom(self):
        """Test GET /api/sort-preferences/{category_id} returns empty when no custom order"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        # Get a category to test with
        categories = self.get_categories(token)
        assert len(categories) > 0, "No categories found"
        
        test_category_id = categories[0]["category_id"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}", 
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "category_id" in data
        assert "article_order" in data
        assert "has_custom_order" in data
        # If no custom order exists, has_custom_order should be False
        print(f"✓ GET /api/sort-preferences/{test_category_id} returned has_custom_order={data['has_custom_order']}")
    
    # ==================== PUT /api/sort-preferences/{category_id} ====================
    
    def test_put_sort_preference_create_new(self):
        """Test PUT /api/sort-preferences/{category_id} creates new sort order"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        # Get categories and find one with articles
        categories = self.get_categories(token)
        assert len(categories) > 0, "No categories found"
        
        # Find a category with articles (try "How to" or first available)
        test_category = None
        for cat in categories:
            articles = self.get_articles_in_category(token, cat["category_id"])
            if len(articles) >= 2:
                test_category = cat
                break
        
        if not test_category:
            pytest.skip("No category with 2+ articles found for testing")
        
        test_category_id = test_category["category_id"]
        articles = self.get_articles_in_category(token, test_category_id)
        
        # Create a custom order (reverse the articles)
        article_ids = [a["article_id"] for a in articles]
        reversed_order = list(reversed(article_ids))
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers,
            json={"article_order": reversed_order}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert data["category_id"] == test_category_id
        assert data["article_order"] == reversed_order
        print(f"✓ PUT /api/sort-preferences/{test_category_id} created custom order with {len(reversed_order)} articles")
        
        # Verify the order was saved
        get_response = self.session.get(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["has_custom_order"] == True
        assert get_data["article_order"] == reversed_order
        print(f"✓ Verified custom order was persisted")
    
    def test_put_sort_preference_update_existing(self):
        """Test PUT /api/sort-preferences/{category_id} updates existing order"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        categories = self.get_categories(token)
        test_category = None
        for cat in categories:
            articles = self.get_articles_in_category(token, cat["category_id"])
            if len(articles) >= 2:
                test_category = cat
                break
        
        if not test_category:
            pytest.skip("No category with 2+ articles found")
        
        test_category_id = test_category["category_id"]
        articles = self.get_articles_in_category(token, test_category_id)
        article_ids = [a["article_id"] for a in articles]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # First create an order
        self.session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers,
            json={"article_order": article_ids}
        )
        
        # Now update with a different order
        new_order = article_ids[1:] + [article_ids[0]]  # Move first to last
        response = self.session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers,
            json={"article_order": new_order}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["article_order"] == new_order
        print(f"✓ PUT updated existing sort preference")
    
    def test_put_sort_preference_editor(self):
        """Test editor can also save sort preferences"""
        token = self.get_auth_token(EDITOR_EMAIL, EDITOR_PASSWORD)
        assert token, "Editor login failed"
        
        # Get admin token to find categories
        admin_token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        categories = self.get_categories(admin_token)
        
        test_category = None
        for cat in categories:
            if not cat.get("is_pinnwand"):  # Editor can't see pinnwand
                articles = self.get_articles_in_category(admin_token, cat["category_id"])
                if len(articles) >= 1:
                    test_category = cat
                    break
        
        if not test_category:
            pytest.skip("No suitable category found for editor test")
        
        test_category_id = test_category["category_id"]
        articles = self.get_articles_in_category(admin_token, test_category_id)
        article_ids = [a["article_id"] for a in articles]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers,
            json={"article_order": article_ids}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Editor can save sort preferences")
    
    # ==================== DELETE /api/sort-preferences/{category_id} ====================
    
    def test_delete_sort_preference(self):
        """Test DELETE /api/sort-preferences/{category_id} resets sort order"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        categories = self.get_categories(token)
        test_category = None
        for cat in categories:
            articles = self.get_articles_in_category(token, cat["category_id"])
            if len(articles) >= 1:
                test_category = cat
                break
        
        if not test_category:
            pytest.skip("No category with articles found")
        
        test_category_id = test_category["category_id"]
        articles = self.get_articles_in_category(token, test_category_id)
        article_ids = [a["article_id"] for a in articles]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # First create a preference
        self.session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers,
            json={"article_order": article_ids}
        )
        
        # Now delete it
        response = self.session.delete(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"✓ DELETE /api/sort-preferences/{test_category_id} returned: {data['message']}")
        
        # Verify it was deleted
        get_response = self.session.get(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["has_custom_order"] == False
        print(f"✓ Verified sort preference was deleted")
    
    def test_delete_sort_preference_nonexistent(self):
        """Test DELETE on non-existent preference returns appropriate message"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Admin login failed"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.delete(
            f"{BASE_URL}/api/sort-preferences/nonexistent_category_123",
            headers=headers
        )
        
        # Should return 200 with message about no preference existing
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"✓ DELETE on non-existent preference returned: {data['message']}")
    
    # ==================== Per-User Isolation Test ====================
    
    def test_sort_preferences_per_user_isolation(self):
        """Test that sort preferences are isolated per user"""
        # Use separate sessions to avoid cookie conflicts
        admin_session = requests.Session()
        admin_session.headers.update({"Content-Type": "application/json"})
        editor_session = requests.Session()
        editor_session.headers.update({"Content-Type": "application/json"})
        
        # Login admin
        admin_resp = admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin_resp.status_code == 200, "Admin login failed"
        admin_token = admin_resp.cookies.get("session_token")
        assert admin_token, "Admin token not found"
        
        # Login editor
        editor_resp = editor_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        assert editor_resp.status_code == 200, "Editor login failed"
        editor_token = editor_resp.cookies.get("session_token")
        assert editor_token, "Editor token not found"
        
        # Get categories using admin session
        categories = admin_session.get(f"{BASE_URL}/api/categories").json()
        test_category = None
        for cat in categories:
            if not cat.get("is_pinnwand"):
                articles_resp = admin_session.get(f"{BASE_URL}/api/articles")
                articles = [a for a in articles_resp.json() if cat["category_id"] in (a.get('category_ids') or [])]
                if len(articles) >= 2:
                    test_category = cat
                    break
        
        if not test_category:
            pytest.skip("No suitable category found")
        
        test_category_id = test_category["category_id"]
        articles_resp = admin_session.get(f"{BASE_URL}/api/articles")
        articles = [a for a in articles_resp.json() if test_category_id in (a.get('category_ids') or [])]
        article_ids = [a["article_id"] for a in articles]
        
        # Admin sets order A
        admin_order = article_ids
        admin_session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            json={"article_order": admin_order}
        )
        
        # Editor sets order B (reversed)
        editor_order = list(reversed(article_ids))
        editor_session.put(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}",
            json={"article_order": editor_order}
        )
        
        # Verify admin still has order A
        admin_get = admin_session.get(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}"
        )
        assert admin_get.status_code == 200
        admin_data = admin_get.json()
        assert admin_data["article_order"] == admin_order, "Admin order was overwritten by editor!"
        
        # Verify editor has order B
        editor_get = editor_session.get(
            f"{BASE_URL}/api/sort-preferences/{test_category_id}"
        )
        assert editor_get.status_code == 200
        editor_data = editor_get.json()
        assert editor_data["article_order"] == editor_order, "Editor order is incorrect!"
        
        print(f"✓ Sort preferences are correctly isolated per user")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/sort-preferences/{test_category_id}")
        editor_session.delete(f"{BASE_URL}/api/sort-preferences/{test_category_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

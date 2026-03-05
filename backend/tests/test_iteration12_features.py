"""
CANUSA Nexus Iteration 12 Tests - New Feature Testing
Tests for:
1. Groups System (CRUD, user-group assignments)
2. Articles with multiple categories (category_ids[])
3. Article expiry_date and is_important
4. Tags API
5. Group-based article visibility
6. Draft visibility (only creator/admin)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_iter12_"


class TestAuthentication:
    """Basic authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_login(self, admin_session):
        """Test admin can login"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "marc.hansen@canusa.de"
        assert data["role"] == "admin"
        print(f"Admin login verified: {data['name']}")


class TestGroupsAPI:
    """Tests for the Groups System"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def test_group_id(self, admin_session):
        """Create a test group and return its ID"""
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "name": f"{TEST_PREFIX}Marketing",
            "description": "Test marketing group"
        })
        assert response.status_code == 200
        data = response.json()
        yield data["group_id"]
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/groups/{data['group_id']}")
    
    def test_get_groups(self, admin_session):
        """GET /api/groups - Get all groups"""
        response = admin_session.get(f"{BASE_URL}/api/groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} groups")
    
    def test_create_group_admin_only(self, admin_session):
        """POST /api/groups - Create group (admin only)"""
        group_name = f"{TEST_PREFIX}Developers_{uuid.uuid4().hex[:6]}"
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "name": group_name,
            "description": "Developer group for testing"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == group_name
        assert "group_id" in data
        print(f"Created group: {data['group_id']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/groups/{data['group_id']}")
    
    def test_create_duplicate_group_fails(self, admin_session, test_group_id):
        """POST /api/groups - Duplicate name should fail"""
        # Get the test group name
        groups = admin_session.get(f"{BASE_URL}/api/groups").json()
        test_group = next((g for g in groups if g["group_id"] == test_group_id), None)
        assert test_group is not None
        
        # Try to create duplicate
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "name": test_group["name"],
            "description": "Duplicate"
        })
        assert response.status_code == 400
        print("Duplicate group creation correctly rejected")
    
    def test_delete_group(self, admin_session):
        """DELETE /api/groups/{id} - Delete group"""
        # Create a group to delete
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "name": f"{TEST_PREFIX}ToDelete_{uuid.uuid4().hex[:6]}"
        })
        assert response.status_code == 200
        group_id = response.json()["group_id"]
        
        # Delete it
        response = admin_session.delete(f"{BASE_URL}/api/groups/{group_id}")
        assert response.status_code == 200
        print("Group deleted successfully")
        
        # Verify it's gone
        response = admin_session.get(f"{BASE_URL}/api/groups")
        groups = response.json()
        assert not any(g["group_id"] == group_id for g in groups)
    
    def test_update_user_groups(self, admin_session, test_group_id):
        """PUT /api/users/{id}/groups - Update user group memberships"""
        # Get users
        users = admin_session.get(f"{BASE_URL}/api/users").json()
        test_user = users[0]  # Use first user
        original_groups = test_user.get("group_ids", [])
        
        # Add group
        new_groups = original_groups + [test_group_id] if test_group_id not in original_groups else original_groups
        response = admin_session.put(f"{BASE_URL}/api/users/{test_user['user_id']}/groups", json={
            "group_ids": new_groups
        })
        assert response.status_code == 200
        print(f"User {test_user['name']} groups updated")
        
        # Verify
        user_response = admin_session.get(f"{BASE_URL}/api/users/{test_user['user_id']}")
        assert test_group_id in user_response.json().get("group_ids", [])
        
        # Restore original
        admin_session.put(f"{BASE_URL}/api/users/{test_user['user_id']}/groups", json={
            "group_ids": original_groups
        })
    
    def test_get_group_members(self, admin_session, test_group_id):
        """GET /api/groups/{id}/members - Get group members"""
        response = admin_session.get(f"{BASE_URL}/api/groups/{test_group_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Group has {len(data)} members")


class TestTagsAPI:
    """Tests for Tags API"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200
        return session
    
    def test_get_tags(self, admin_session):
        """GET /api/tags - Get all unique tags"""
        response = admin_session.get(f"{BASE_URL}/api/tags")
        assert response.status_code == 200
        data = response.json()
        assert "tags" in data
        assert isinstance(data["tags"], list)
        print(f"Found {len(data['tags'])} unique tags")


class TestArticlesWithNewFeatures:
    """Tests for Article features: multiple categories, expiry, importance, visibility"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def test_categories(self, admin_session):
        """Get existing categories for testing"""
        response = admin_session.get(f"{BASE_URL}/api/categories")
        return response.json()[:2] if len(response.json()) >= 2 else []
    
    @pytest.fixture(scope="class")
    def test_group(self, admin_session):
        """Create a test group for visibility testing"""
        response = admin_session.post(f"{BASE_URL}/api/groups", json={
            "name": f"{TEST_PREFIX}VisibilityTest_{uuid.uuid4().hex[:6]}"
        })
        assert response.status_code == 200
        data = response.json()
        yield data
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/groups/{data['group_id']}")
    
    def test_create_article_with_multiple_categories(self, admin_session, test_categories):
        """POST /api/articles with category_ids[] - Multiple categories"""
        if len(test_categories) < 2:
            pytest.skip("Need at least 2 categories for this test")
        
        category_ids = [cat["category_id"] for cat in test_categories]
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Multi-Category Article",
            "content": "<p>Article with multiple categories</p>",
            "category_ids": category_ids,
            "status": "draft",
            "tags": ["test", "multicategory"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "article_id" in data
        assert data["category_ids"] == category_ids
        print(f"Created article with {len(category_ids)} categories")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{data['article_id']}")
    
    def test_create_article_with_expiry_date(self, admin_session):
        """POST /api/articles with expiry_date"""
        expiry = (datetime.now() + timedelta(days=30)).isoformat()
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Expiring Article",
            "content": "<p>This article expires</p>",
            "status": "published",
            "expiry_date": expiry
        })
        assert response.status_code == 200
        data = response.json()
        assert data["expiry_date"] is not None
        print(f"Created article with expiry: {data['expiry_date']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{data['article_id']}")
    
    def test_create_article_with_important_marking(self, admin_session):
        """POST /api/articles with is_important and important_until"""
        important_until = (datetime.now() + timedelta(days=7)).isoformat()
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Important Article",
            "content": "<p>This is important!</p>",
            "status": "published",
            "is_important": True,
            "important_until": important_until
        })
        assert response.status_code == 200
        data = response.json()
        assert data["is_important"] == True
        assert data["important_until"] is not None
        print(f"Created important article until: {data['important_until']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{data['article_id']}")
    
    def test_create_article_with_group_visibility(self, admin_session, test_group):
        """POST /api/articles with visible_to_groups[]"""
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Group-Restricted Article",
            "content": "<p>Only for specific groups</p>",
            "status": "published",
            "visible_to_groups": [test_group["group_id"]]
        })
        assert response.status_code == 200
        data = response.json()
        assert test_group["group_id"] in data["visible_to_groups"]
        print(f"Created article visible to group: {test_group['name']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{data['article_id']}")
    
    def test_create_article_with_tags(self, admin_session):
        """POST /api/articles with tags[]"""
        tags = ["reisen", "usa", "kanada", "tourismus"]
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Tagged Article",
            "content": "<p>Article with tags</p>",
            "status": "draft",
            "tags": tags
        })
        assert response.status_code == 200
        data = response.json()
        assert set(data["tags"]) == set(tags)
        print(f"Created article with tags: {data['tags']}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{data['article_id']}")
    
    def test_draft_visibility_admin_sees_all(self, admin_session):
        """Admin should see all draft articles"""
        # Create a draft
        response = admin_session.post(f"{BASE_URL}/api/articles", json={
            "title": f"{TEST_PREFIX}Admin Draft Test",
            "content": "<p>Draft content</p>",
            "status": "draft"
        })
        assert response.status_code == 200
        article_id = response.json()["article_id"]
        
        # Get articles and verify draft is visible
        articles = admin_session.get(f"{BASE_URL}/api/articles").json()
        draft_found = any(a["article_id"] == article_id for a in articles)
        assert draft_found, "Admin should see draft articles"
        print("Admin can see draft articles")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


class TestArticlesFiltering:
    """Tests for article list filtering based on status and groups"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200
        return session
    
    def test_get_articles_no_filter(self, admin_session):
        """GET /api/articles - Get all articles"""
        response = admin_session.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Total articles: {len(data)}")
    
    def test_get_articles_by_status(self, admin_session):
        """GET /api/articles?status=published - Filter by status"""
        response = admin_session.get(f"{BASE_URL}/api/articles?status=published")
        assert response.status_code == 200
        data = response.json()
        for article in data:
            assert article["status"] == "published"
        print(f"Published articles: {len(data)}")
    
    def test_get_articles_by_category(self, admin_session):
        """GET /api/articles?category_id=xxx - Filter by category"""
        # Get a category
        categories = admin_session.get(f"{BASE_URL}/api/categories").json()
        if not categories:
            pytest.skip("No categories available")
        
        category_id = categories[0]["category_id"]
        response = admin_session.get(f"{BASE_URL}/api/articles?category_id={category_id}")
        assert response.status_code == 200
        print(f"Articles in category: {len(response.json())}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.hansen@canusa.de",
            "password": "CanusaNexus2024!"
        })
        assert response.status_code == 200
        return session
    
    def test_cleanup_test_groups(self, admin_session):
        """Clean up any remaining test groups"""
        groups = admin_session.get(f"{BASE_URL}/api/groups").json()
        cleaned = 0
        for group in groups:
            if group["name"].startswith(TEST_PREFIX):
                admin_session.delete(f"{BASE_URL}/api/groups/{group['group_id']}")
                cleaned += 1
        print(f"Cleaned up {cleaned} test groups")
    
    def test_cleanup_test_articles(self, admin_session):
        """Clean up any remaining test articles"""
        articles = admin_session.get(f"{BASE_URL}/api/articles").json()
        cleaned = 0
        for article in articles:
            if article["title"].startswith(TEST_PREFIX):
                admin_session.delete(f"{BASE_URL}/api/articles/{article['article_id']}")
                cleaned += 1
        print(f"Cleaned up {cleaned} test articles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

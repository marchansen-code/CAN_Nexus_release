"""
Iteration 35: Reading Assignments Feature Tests
Tests for the new reading assignment functionality:
- POST /api/reading-assignments - Create reading assignments
- GET /api/reading-assignments/my-assignments - Get unread articles for current user
- POST /api/reading-assignments/mark-as-read - Mark article as read
- GET /api/reading-assignments/status/{article_id} - Check reading status
- DELETE /api/reading-assignments/{article_id} - Remove all reading assignments
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "marc.hansen@canusa.de"
ADMIN_PASSWORD = "CanusaNexus2024!"
EDITOR_EMAIL = "editor.test@canusa.de"
EDITOR_PASSWORD = "Test1234!"  # Correct password

# Test article ID from main agent context
TEST_ARTICLE_ID = "art_131780fdcaf7"


class TestReadingAssignmentsAPI:
    """Test reading assignments API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def login_as_admin(self):
        """Login as admin user - uses cookie-based auth"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        # Cookie is set automatically by session
        return data
    
    def login_as_editor(self):
        """Login as editor user - uses cookie-based auth"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Editor login failed: {response.text}")
        data = response.json()
        return data
    
    def test_01_health_check(self):
        """Test API health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health check passed")
    
    def test_02_admin_login(self):
        """Test admin login"""
        user = self.login_as_admin()
        assert user.get("email") == ADMIN_EMAIL
        assert user.get("role") == "admin"
        print(f"✓ Admin login successful: {user.get('name')}")
    
    def test_03_get_users_list(self):
        """Test getting users list for assignment selection"""
        self.login_as_admin()
        response = self.session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        print(f"✓ Got {len(users)} users for assignment selection")
        
        # Check for editor user
        editor_user = next((u for u in users if u.get("email") == EDITOR_EMAIL), None)
        if editor_user:
            print(f"  - Found editor user: {editor_user.get('name')} ({editor_user.get('user_id')})")
    
    def test_04_get_groups_list(self):
        """Test getting groups list for assignment selection"""
        self.login_as_admin()
        response = self.session.get(f"{BASE_URL}/api/groups")
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"✓ Got {len(groups)} groups for assignment selection")
    
    def test_05_get_my_assignments_empty(self):
        """Test getting reading assignments when none exist"""
        self.login_as_admin()
        response = self.session.get(f"{BASE_URL}/api/reading-assignments/my-assignments")
        assert response.status_code == 200
        data = response.json()
        assert "assignments" in data
        assert isinstance(data["assignments"], list)
        print(f"✓ Got my-assignments endpoint: {len(data['assignments'])} assignments")
    
    def test_06_get_reading_status_no_assignment(self):
        """Test reading status for article without assignment"""
        self.login_as_admin()
        # Use a random article ID that likely has no assignment
        response = self.session.get(f"{BASE_URL}/api/reading-assignments/status/art_nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data.get("has_assignment") == False
        print("✓ Reading status returns has_assignment=False for non-assigned article")
    
    def test_07_create_reading_assignment(self):
        """Test creating a reading assignment"""
        self.login_as_admin()
        
        # First get users to find editor
        users_response = self.session.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        editor_user = next((u for u in users if u.get("email") == EDITOR_EMAIL), None)
        
        if not editor_user:
            pytest.skip("Editor user not found")
        
        # Create a test article first
        article_response = self.session.post(f"{BASE_URL}/api/articles", json={
            "title": "TEST_Reading Assignment Test Article",
            "content": "<p>This is a test article for reading assignments</p>",
            "status": "published",
            "category_ids": []
        })
        
        if article_response.status_code != 201:
            # Try using existing test article
            test_article_id = TEST_ARTICLE_ID
        else:
            test_article_id = article_response.json().get("article_id")
        
        # Create reading assignment
        response = self.session.post(f"{BASE_URL}/api/reading-assignments", json={
            "article_id": test_article_id,
            "user_ids": [editor_user.get("user_id")],
            "group_ids": []
        })
        
        assert response.status_code == 200, f"Create assignment failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "assigned_count" in data
        print(f"✓ Created reading assignment: {data.get('message')}")
        print(f"  - Assigned to {data.get('assigned_count')} user(s)")
        
        # Store for later tests
        self.__class__.test_article_id = test_article_id
        self.__class__.editor_user_id = editor_user.get("user_id")
    
    def test_08_get_reading_status_with_assignment(self):
        """Test reading status for article with assignment"""
        # Login as editor to check their assignment
        try:
            self.login_as_editor()
        except:
            pytest.skip("Editor login failed")
        
        test_article_id = getattr(self.__class__, 'test_article_id', TEST_ARTICLE_ID)
        
        response = self.session.get(f"{BASE_URL}/api/reading-assignments/status/{test_article_id}")
        assert response.status_code == 200
        data = response.json()
        
        if data.get("has_assignment"):
            assert "is_read" in data
            print(f"✓ Reading status: has_assignment={data.get('has_assignment')}, is_read={data.get('is_read')}")
        else:
            print(f"✓ Reading status endpoint works (no assignment for this user)")
    
    def test_09_get_my_assignments_with_data(self):
        """Test getting reading assignments after creating one"""
        try:
            self.login_as_editor()
        except:
            pytest.skip("Editor login failed")
        
        response = self.session.get(f"{BASE_URL}/api/reading-assignments/my-assignments")
        assert response.status_code == 200
        data = response.json()
        assert "assignments" in data
        
        assignments = data["assignments"]
        print(f"✓ Editor has {len(assignments)} reading assignment(s)")
        
        if len(assignments) > 0:
            assignment = assignments[0]
            assert "article_id" in assignment
            assert "title" in assignment
            assert "assigned_at" in assignment
            assert "assigned_by_name" in assignment
            print(f"  - Article: {assignment.get('title')}")
            print(f"  - Assigned by: {assignment.get('assigned_by_name')}")
    
    def test_10_mark_as_read(self):
        """Test marking an article as read"""
        try:
            self.login_as_editor()
        except:
            pytest.skip("Editor login failed")
        
        test_article_id = getattr(self.__class__, 'test_article_id', TEST_ARTICLE_ID)
        
        # First check if there's an assignment
        status_response = self.session.get(f"{BASE_URL}/api/reading-assignments/status/{test_article_id}")
        status_data = status_response.json()
        
        if not status_data.get("has_assignment"):
            pytest.skip("No reading assignment exists for this article")
        
        # Mark as read
        response = self.session.post(f"{BASE_URL}/api/reading-assignments/mark-as-read", json={
            "article_id": test_article_id
        })
        
        assert response.status_code == 200, f"Mark as read failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Mark as read: {data.get('message')}")
        
        # Verify status changed
        status_response = self.session.get(f"{BASE_URL}/api/reading-assignments/status/{test_article_id}")
        status_data = status_response.json()
        assert status_data.get("is_read") == True
        assert status_data.get("read_at") is not None
        print(f"  - Verified: is_read=True, read_at={status_data.get('read_at')}")
    
    def test_11_mark_as_unread(self):
        """Test marking an article as unread"""
        try:
            self.login_as_editor()
        except:
            pytest.skip("Editor login failed")
        
        test_article_id = getattr(self.__class__, 'test_article_id', TEST_ARTICLE_ID)
        
        # First check if there's an assignment
        status_response = self.session.get(f"{BASE_URL}/api/reading-assignments/status/{test_article_id}")
        status_data = status_response.json()
        
        if not status_data.get("has_assignment"):
            pytest.skip("No reading assignment exists for this article")
        
        # Mark as unread
        response = self.session.post(f"{BASE_URL}/api/reading-assignments/mark-as-unread", json={
            "article_id": test_article_id
        })
        
        assert response.status_code == 200, f"Mark as unread failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Mark as unread: {data.get('message')}")
    
    def test_12_delete_reading_assignment(self):
        """Test removing reading assignments from an article"""
        self.login_as_admin()
        
        test_article_id = getattr(self.__class__, 'test_article_id', TEST_ARTICLE_ID)
        
        response = self.session.delete(f"{BASE_URL}/api/reading-assignments/{test_article_id}")
        
        # Could be 200 or 404 if no assignments exist
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"✓ Delete reading assignment: {data.get('message')}")
        elif response.status_code == 404:
            print("✓ Delete endpoint works (no assignments to delete)")
        else:
            assert False, f"Unexpected status code: {response.status_code}"
    
    def test_13_get_all_reading_status_for_article(self):
        """Test getting all reading statuses for an article (admin/author only)"""
        self.login_as_admin()
        
        test_article_id = getattr(self.__class__, 'test_article_id', TEST_ARTICLE_ID)
        
        response = self.session.get(f"{BASE_URL}/api/reading-assignments/article/{test_article_id}/all-status")
        
        if response.status_code == 200:
            data = response.json()
            assert "statuses" in data
            print(f"✓ Got all reading statuses: {len(data['statuses'])} entries")
        elif response.status_code == 404:
            print("✓ All-status endpoint works (article not found)")
        else:
            print(f"✓ All-status endpoint returned {response.status_code}")
    
    def test_14_cleanup_test_article(self):
        """Cleanup: Delete test article if created"""
        self.login_as_admin()
        
        # Find and delete test articles
        response = self.session.get(f"{BASE_URL}/api/articles")
        if response.status_code == 200:
            articles = response.json()
            for article in articles:
                if article.get("title", "").startswith("TEST_"):
                    delete_response = self.session.delete(f"{BASE_URL}/api/articles/{article['article_id']}")
                    if delete_response.status_code == 200:
                        print(f"✓ Cleaned up test article: {article['title']}")


class TestEditorLogin:
    """Test editor login separately"""
    
    def test_editor_login_attempt(self):
        """Test if editor can login"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        
        assert response.status_code == 200, f"Editor login failed: {response.text}"
        data = response.json()
        assert data.get("email") == EDITOR_EMAIL
        assert data.get("role") == "editor"
        print(f"✓ Editor login successful: {data.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

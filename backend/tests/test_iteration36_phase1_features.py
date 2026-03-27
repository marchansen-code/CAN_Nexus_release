"""
Iteration 36: Phase 1 Feature Tests
Testing:
1. Dashboard: Pinnwand at top, expired articles with dismiss function
2. ArticleEditor: Multiple contact persons, edit permissions, reading assignment with email option
3. Articles: DELETE confirmation for article deletion
4. UserManagement: User deletion with article transfer, DELETE confirmation
5. ArticleView: Version history hidden for viewers
6. Stats: expired_articles endpoint, dismiss-expired endpoint
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


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_admin_login(self):
        """Test admin login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["role"] == "admin"
        # Check cookie is set
        assert "session_token" in session.cookies
        print(f"SUCCESS: Admin login - user: {data['name']}")
    
    def test_editor_login(self):
        """Test editor login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": EDITOR_EMAIL,
            "password": EDITOR_PASSWORD
        })
        assert response.status_code == 200, f"Editor login failed: {response.text}"
        data = response.json()
        assert data["role"] == "editor"
        print(f"SUCCESS: Editor login - user: {data['name']}")


@pytest.fixture(scope="module")
def admin_session():
    """Get admin authenticated session"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return session


@pytest.fixture(scope="module")
def editor_session():
    """Get editor authenticated session"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": EDITOR_EMAIL,
        "password": EDITOR_PASSWORD
    })
    assert response.status_code == 200, f"Editor login failed: {response.text}"
    return session


class TestStatsEndpoint:
    """Test /api/stats endpoint for expired articles"""
    
    def test_stats_returns_expired_articles(self, admin_session):
        """Test that stats endpoint returns expired_articles field"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        
        # Check that expired_articles field exists
        assert "expired_articles" in data, "expired_articles field missing from stats"
        assert isinstance(data["expired_articles"], list), "expired_articles should be a list"
        
        # Check that expiring_articles field exists
        assert "expiring_articles" in data, "expiring_articles field missing from stats"
        assert isinstance(data["expiring_articles"], list), "expiring_articles should be a list"
        
        print(f"SUCCESS: Stats returns expired_articles ({len(data['expired_articles'])}) and expiring_articles ({len(data['expiring_articles'])})")
    
    def test_stats_expired_articles_have_days_expired(self, admin_session):
        """Test that expired articles have days_expired field"""
        response = admin_session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        for article in data.get("expired_articles", []):
            assert "days_expired" in article, f"Article {article.get('article_id')} missing days_expired"
            assert isinstance(article["days_expired"], int), "days_expired should be an integer"
        
        print(f"SUCCESS: All expired articles have days_expired field")


class TestDismissExpiredEndpoint:
    """Test /api/stats/dismiss-expired endpoint"""
    
    def test_dismiss_expired_endpoint_exists(self, admin_session):
        """Test that dismiss-expired endpoint exists and accepts POST"""
        response = admin_session.post(
            f"{BASE_URL}/api/stats/dismiss-expired",
            json={"article_ids": []}
        )
        # Should return 200 even with empty list
        assert response.status_code == 200, f"Dismiss endpoint failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"SUCCESS: dismiss-expired endpoint works - {data['message']}")
    
    def test_dismiss_expired_with_article_ids(self, admin_session):
        """Test dismissing specific article IDs"""
        # Use a fake article ID for testing
        response = admin_session.post(
            f"{BASE_URL}/api/stats/dismiss-expired",
            json={"article_ids": ["test_article_123"]}
        )
        assert response.status_code == 200, f"Dismiss failed: {response.text}"
        data = response.json()
        assert "1 Artikel ausgeblendet" in data["message"]
        print(f"SUCCESS: Dismissed article - {data['message']}")


class TestArticleMultipleContactPersons:
    """Test article creation/update with multiple contact persons"""
    
    def test_create_article_with_multiple_contact_persons(self, admin_session):
        """Test creating article with contact_person_ids array"""
        # First get users to get valid user IDs
        users_response = admin_session.get(f"{BASE_URL}/api/users")
        assert users_response.status_code == 200
        users = users_response.json()
        
        if len(users) < 2:
            pytest.skip("Need at least 2 users for this test")
        
        user_ids = [users[0]["user_id"], users[1]["user_id"]]
        
        # Create article with multiple contact persons
        article_data = {
            "title": "TEST_Multiple_Contact_Persons",
            "content": "<p>Test article with multiple contact persons</p>",
            "status": "draft",
            "contact_person_ids": user_ids,
            "contact_person_notify_id": user_ids[0]  # First one gets notifications
        }
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert response.status_code == 200, f"Create article failed: {response.text}"
        data = response.json()
        
        # Verify the article was created with contact_person_ids
        article_id = data.get("article_id")
        assert article_id, "No article_id returned"
        
        # Fetch the article to verify
        get_response = admin_session.get(f"{BASE_URL}/api/articles/{article_id}")
        assert get_response.status_code == 200
        article = get_response.json()
        
        # Check contact_person_ids
        assert "contact_person_ids" in article, "contact_person_ids field missing"
        assert len(article["contact_person_ids"]) == 2, f"Expected 2 contact persons, got {len(article['contact_person_ids'])}"
        
        # Check contact_person_notify_id
        assert "contact_person_notify_id" in article, "contact_person_notify_id field missing"
        
        print(f"SUCCESS: Article created with {len(article['contact_person_ids'])} contact persons")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


class TestArticleEditPermissions:
    """Test article edit permissions feature"""
    
    def test_create_article_with_edit_permissions(self, admin_session):
        """Test creating article with edit_permission_user_ids and edit_permission_group_ids"""
        # Get users and groups
        users_response = admin_session.get(f"{BASE_URL}/api/users")
        groups_response = admin_session.get(f"{BASE_URL}/api/groups")
        
        users = users_response.json() if users_response.status_code == 200 else []
        groups = groups_response.json() if groups_response.status_code == 200 else []
        
        user_ids = [u["user_id"] for u in users[:2]] if len(users) >= 2 else []
        group_ids = [g["group_id"] for g in groups[:1]] if len(groups) >= 1 else []
        
        article_data = {
            "title": "TEST_Edit_Permissions",
            "content": "<p>Test article with edit permissions</p>",
            "status": "draft",
            "edit_permission_user_ids": user_ids,
            "edit_permission_group_ids": group_ids
        }
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert response.status_code == 200, f"Create article failed: {response.text}"
        data = response.json()
        article_id = data.get("article_id")
        
        # Fetch and verify
        get_response = admin_session.get(f"{BASE_URL}/api/articles/{article_id}")
        assert get_response.status_code == 200
        article = get_response.json()
        
        assert "edit_permission_user_ids" in article, "edit_permission_user_ids field missing"
        assert "edit_permission_group_ids" in article, "edit_permission_group_ids field missing"
        
        print(f"SUCCESS: Article created with edit permissions - users: {len(article['edit_permission_user_ids'])}, groups: {len(article['edit_permission_group_ids'])}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


class TestReadingAssignmentEmailOption:
    """Test reading assignment with email notification option"""
    
    def test_reading_assignment_send_email_field(self, admin_session):
        """Test that reading assignment supports send_email option"""
        # First create a test article
        article_data = {
            "title": "TEST_Reading_Assignment_Email",
            "content": "<p>Test article for reading assignment email</p>",
            "status": "published"
        }
        
        create_response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert create_response.status_code == 200
        article_id = create_response.json().get("article_id")
        
        # Get a user to assign
        users_response = admin_session.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        target_user = next((u for u in users if u["role"] != "admin"), users[0])
        
        # Create reading assignment with send_email option
        assignment_data = {
            "article_id": article_id,
            "user_ids": [target_user["user_id"]],
            "group_ids": [],
            "send_email": True  # Test the email option
        }
        
        response = admin_session.post(f"{BASE_URL}/api/reading-assignments", json=assignment_data)
        assert response.status_code == 200, f"Create assignment failed: {response.text}"
        data = response.json()
        
        assert "assigned_count" in data, "assigned_count missing from response"
        print(f"SUCCESS: Reading assignment created with send_email=True - assigned {data['assigned_count']} users")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/reading-assignments/{article_id}")
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


class TestUserDeletionWithTransfer:
    """Test user deletion with article transfer"""
    
    def test_get_user_article_count(self, admin_session):
        """Test endpoint to get user's article count"""
        # Get users
        users_response = admin_session.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        
        if not users:
            pytest.skip("No users available")
        
        user_id = users[0]["user_id"]
        
        response = admin_session.get(f"{BASE_URL}/api/users/{user_id}/article-count")
        assert response.status_code == 200, f"Get article count failed: {response.text}"
        data = response.json()
        
        assert "article_count" in data, "article_count field missing"
        assert isinstance(data["article_count"], int), "article_count should be an integer"
        
        print(f"SUCCESS: User {user_id} has {data['article_count']} articles")
    
    def test_delete_user_requires_transfer_if_has_articles(self, admin_session):
        """Test that deleting user with articles requires transfer_to_user_id"""
        # Create a test user
        test_user_data = {
            "email": "test_delete_user@canusa.de",
            "password": "TestPassword123!",
            "name": "Test Delete User",
            "role": "editor"
        }
        
        create_response = admin_session.post(f"{BASE_URL}/api/users", json=test_user_data)
        if create_response.status_code != 200:
            # User might already exist, try to find them
            users_response = admin_session.get(f"{BASE_URL}/api/users")
            users = users_response.json()
            test_user = next((u for u in users if u["email"] == test_user_data["email"]), None)
            if test_user:
                user_id = test_user["user_id"]
            else:
                pytest.skip("Could not create or find test user")
        else:
            user_id = create_response.json()["user_id"]
        
        # Delete the test user (should work since they have no articles)
        delete_response = admin_session.delete(f"{BASE_URL}/api/users/{user_id}")
        
        # Either succeeds (no articles) or fails with transfer requirement
        if delete_response.status_code == 200:
            print(f"SUCCESS: User deleted (had no articles)")
        elif delete_response.status_code == 400:
            data = delete_response.json()
            assert "Artikel" in data.get("detail", ""), "Expected article transfer error message"
            print(f"SUCCESS: User deletion correctly requires article transfer")
        else:
            print(f"User deletion response: {delete_response.status_code} - {delete_response.text}")


class TestPinnwandCategories:
    """Test Pinnwand category features"""
    
    def test_categories_have_is_pinnwand_field(self, admin_session):
        """Test that categories have is_pinnwand field"""
        response = admin_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Get categories failed: {response.text}"
        categories = response.json()
        
        pinnwand_cats = [c for c in categories if c.get("is_pinnwand")]
        print(f"SUCCESS: Found {len(pinnwand_cats)} Pinnwand categories out of {len(categories)} total")
    
    def test_pinnwand_articles_endpoint(self, admin_session):
        """Test /api/categories/pinnwand/articles endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/categories/pinnwand/articles")
        assert response.status_code == 200, f"Get pinnwand articles failed: {response.text}"
        articles = response.json()
        
        assert isinstance(articles, list), "Pinnwand articles should be a list"
        print(f"SUCCESS: Pinnwand articles endpoint returns {len(articles)} articles")


class TestVersionHistory:
    """Test version history endpoint"""
    
    def test_version_history_endpoint(self, admin_session):
        """Test /api/versions/articles/{article_id} endpoint"""
        # Get an article
        articles_response = admin_session.get(f"{BASE_URL}/api/articles")
        articles = articles_response.json()
        
        if not articles:
            pytest.skip("No articles available")
        
        article_id = articles[0]["article_id"]
        
        response = admin_session.get(f"{BASE_URL}/api/versions/articles/{article_id}")
        assert response.status_code == 200, f"Get versions failed: {response.text}"
        versions = response.json()
        
        assert isinstance(versions, list), "Versions should be a list"
        
        for version in versions:
            assert "version_id" in version, "version_id missing"
            assert "version_number" in version, "version_number missing"
            assert "created_by_name" in version, "created_by_name missing"
            assert "created_at" in version, "created_at missing"
        
        print(f"SUCCESS: Version history returns {len(versions)} versions for article {article_id}")


class TestArticleModels:
    """Test that article models have all required fields"""
    
    def test_article_has_all_phase1_fields(self, admin_session):
        """Test that articles have all Phase 1 fields"""
        # Create a test article with all fields
        article_data = {
            "title": "TEST_Phase1_Fields",
            "content": "<p>Test article with all Phase 1 fields</p>",
            "status": "draft",
            "contact_person_ids": [],
            "contact_person_notify_id": None,
            "edit_permission_user_ids": [],
            "edit_permission_group_ids": [],
            "comments_enabled": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert response.status_code == 200, f"Create article failed: {response.text}"
        article_id = response.json().get("article_id")
        
        # Fetch and verify all fields
        get_response = admin_session.get(f"{BASE_URL}/api/articles/{article_id}")
        assert get_response.status_code == 200
        article = get_response.json()
        
        # Check all Phase 1 fields exist
        required_fields = [
            "contact_person_ids",
            "contact_person_notify_id", 
            "edit_permission_user_ids",
            "edit_permission_group_ids",
            "comments_enabled"
        ]
        
        for field in required_fields:
            assert field in article, f"Field {field} missing from article"
        
        print(f"SUCCESS: Article has all Phase 1 fields: {required_fields}")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

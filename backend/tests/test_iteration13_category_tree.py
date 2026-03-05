"""
CANUSA Nexus Iteration 13 Tests - Category Tree & New Article Button
Tests for:
1. Category hierarchy with parent_id relationships
2. Articles with category_ids array (multi-category support)
3. Filtering articles by category
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_PREFIX = "TEST_iter13_"


@pytest.fixture(scope="module")
def admin_session():
    """Get admin authentication token"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "marc.hansen@canusa.de",
        "password": "CanusaNexus2024!"
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return session


class TestAuthentication:
    """Basic authentication tests"""
    
    def test_admin_login(self, admin_session):
        """Test admin can login successfully"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "marc.hansen@canusa.de"
        assert data["role"] == "admin"
        print(f"Admin login verified: {data['name']}")


class TestCategoryHierarchy:
    """Tests for hierarchical category structure"""
    
    def test_get_all_categories(self, admin_session):
        """Test getting all categories"""
        response = admin_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        print(f"Found {len(categories)} categories")
        return categories
    
    def test_categories_have_parent_id_field(self, admin_session):
        """Test that categories have parent_id field for hierarchy"""
        response = admin_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        
        for cat in categories:
            assert "parent_id" in cat, f"Category {cat['name']} missing parent_id field"
            assert "category_id" in cat, f"Category {cat['name']} missing category_id field"
        
        # Check for hierarchical structure - some should have parent_id, some should be root
        root_categories = [c for c in categories if c.get("parent_id") is None]
        child_categories = [c for c in categories if c.get("parent_id") is not None]
        
        print(f"Root categories: {len(root_categories)}, Child categories: {len(child_categories)}")
        assert len(root_categories) > 0, "Expected at least one root category"
    
    def test_parent_child_relationship(self, admin_session):
        """Test that parent-child relationships are valid"""
        response = admin_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        
        category_ids = {c["category_id"] for c in categories}
        
        for cat in categories:
            if cat.get("parent_id"):
                assert cat["parent_id"] in category_ids, \
                    f"Category {cat['name']} has invalid parent_id {cat['parent_id']}"
    
    def test_create_hierarchical_categories(self, admin_session):
        """Test creating parent and child categories"""
        # Create parent category
        unique_id = uuid.uuid4().hex[:8]
        parent_data = {
            "name": f"{TEST_PREFIX}Parent_{unique_id}",
            "description": "Test parent category",
            "order": 0
        }
        
        response = admin_session.post(f"{BASE_URL}/api/categories", json=parent_data)
        assert response.status_code == 200
        parent = response.json()
        parent_id = parent["category_id"]
        print(f"Created parent category: {parent['name']}")
        
        # Create child category
        child_data = {
            "name": f"{TEST_PREFIX}Child_{unique_id}",
            "description": "Test child category",
            "parent_id": parent_id,
            "order": 0
        }
        
        response = admin_session.post(f"{BASE_URL}/api/categories", json=child_data)
        assert response.status_code == 200
        child = response.json()
        print(f"Created child category: {child['name']} with parent_id: {child['parent_id']}")
        
        assert child["parent_id"] == parent_id, "Child category should reference parent"
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/categories/{child['category_id']}")
        admin_session.delete(f"{BASE_URL}/api/categories/{parent_id}")
        print("Cleaned up test categories")


class TestArticleMultiCategory:
    """Tests for articles with multiple categories (category_ids array)"""
    
    def test_articles_have_category_ids_array(self, admin_session):
        """Test that articles support category_ids array"""
        response = admin_session.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        articles = response.json()
        
        for article in articles:
            # Articles should have category_ids (array) or legacy category_id
            has_category_ids = "category_ids" in article
            has_legacy = "category_id" in article
            assert has_category_ids or has_legacy, f"Article {article['title']} missing category fields"
            
            if has_category_ids:
                assert isinstance(article["category_ids"], list), \
                    f"category_ids should be a list for article {article['title']}"
        
        print(f"Verified {len(articles)} articles have category fields")
    
    def test_create_article_with_multiple_categories(self, admin_session):
        """Test creating an article with multiple categories"""
        # Get existing categories for testing
        cat_response = admin_session.get(f"{BASE_URL}/api/categories")
        categories = cat_response.json()
        
        if len(categories) < 2:
            pytest.skip("Need at least 2 categories for multi-category test")
        
        category_ids = [categories[0]["category_id"], categories[1]["category_id"]]
        unique_id = uuid.uuid4().hex[:8]
        
        article_data = {
            "title": f"{TEST_PREFIX}MultiCat Article {unique_id}",
            "content": "<p>Test article with multiple categories</p>",
            "category_ids": category_ids,
            "status": "draft",
            "tags": ["test"]
        }
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert response.status_code == 200
        article = response.json()
        
        assert "category_ids" in article
        assert set(article["category_ids"]) == set(category_ids), \
            f"Expected categories {category_ids}, got {article['category_ids']}"
        
        print(f"Created article with {len(category_ids)} categories")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article['article_id']}")
        print("Cleaned up test article")
    
    def test_filter_articles_by_category(self, admin_session):
        """Test filtering articles by category_id parameter"""
        # Get categories
        cat_response = admin_session.get(f"{BASE_URL}/api/categories")
        categories = cat_response.json()
        
        if not categories:
            pytest.skip("No categories available for testing")
        
        # Try filtering by first category
        test_cat_id = categories[0]["category_id"]
        response = admin_session.get(f"{BASE_URL}/api/articles?category_id={test_cat_id}")
        assert response.status_code == 200
        
        filtered_articles = response.json()
        
        # Verify all returned articles have this category
        for article in filtered_articles:
            cat_ids = article.get("category_ids", [])
            if article.get("category_id"):
                cat_ids.append(article["category_id"])
            assert test_cat_id in cat_ids, \
                f"Article {article['title']} should have category {test_cat_id}"
        
        print(f"Filter by category returned {len(filtered_articles)} articles")


class TestArticlesByCategoryEndpoint:
    """Test the /articles/by-category endpoint"""
    
    def test_get_articles_by_category(self, admin_session):
        """Test the dedicated by-category endpoint"""
        # Get categories first
        cat_response = admin_session.get(f"{BASE_URL}/api/categories")
        categories = cat_response.json()
        
        if not categories:
            pytest.skip("No categories available")
        
        test_cat_id = categories[0]["category_id"]
        response = admin_session.get(f"{BASE_URL}/api/articles/by-category/{test_cat_id}")
        assert response.status_code == 200
        
        articles = response.json()
        assert isinstance(articles, list)
        print(f"Found {len(articles)} articles in category {categories[0]['name']}")


class TestTopViewedArticles:
    """Test top-viewed articles endpoint"""
    
    def test_get_top_viewed(self, admin_session):
        """Test getting top viewed articles"""
        response = admin_session.get(f"{BASE_URL}/api/articles/top-viewed?limit=10")
        assert response.status_code == 200
        
        articles = response.json()
        assert isinstance(articles, list)
        assert len(articles) <= 10
        print(f"Top viewed articles: {len(articles)}")


class TestTagsAPI:
    """Test tags API"""
    
    def test_get_all_tags(self, admin_session):
        """Test getting all unique tags"""
        response = admin_session.get(f"{BASE_URL}/api/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert "tags" in data
        assert isinstance(data["tags"], list)
        print(f"Found {len(data['tags'])} unique tags")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

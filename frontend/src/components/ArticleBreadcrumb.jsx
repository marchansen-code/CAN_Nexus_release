import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Home, FolderTree } from "lucide-react";

// Helper function to build category breadcrumb path
const buildCategoryPath = (categoryId, categories) => {
  if (!categoryId || !categories || categories.length === 0) return [];
  
  const path = [];
  let currentCat = categories.find(c => c.category_id === categoryId);
  
  // Traverse up the category tree
  while (currentCat) {
    path.unshift(currentCat);
    currentCat = categories.find(c => c.category_id === currentCat.parent_id);
  }
  
  return path;
};

// Breadcrumb Component for displaying article hierarchy
export const ArticleBreadcrumb = ({ 
  article = null, 
  categories = [], 
  categoryId = null,
  showHome = true,
  showArticles = true,
  className = ""
}) => {
  const navigate = useNavigate();
  
  // Use provided categoryId or get from article
  const effectiveCategoryId = categoryId || (article?.category_ids?.[0]) || article?.category_id;
  const breadcrumbPath = buildCategoryPath(effectiveCategoryId, categories);
  
  // Helper function to navigate while storing origin
  const navigateToArticle = (path) => {
    sessionStorage.setItem('article_origin_url', window.location.pathname + window.location.search);
    navigate(path);
  };
  
  return (
    <div className={`flex items-center gap-1 text-sm text-muted-foreground flex-wrap ${className}`} data-testid="article-breadcrumb">
      {showHome && (
        <>
          <button 
            onClick={() => navigate("/")}
            className="flex items-center hover:text-foreground transition-colors"
            title="Startseite"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
        </>
      )}
      {showArticles && (
        <>
          <button 
            onClick={() => navigate("/articles")}
            className="hover:text-foreground transition-colors"
          >
            Artikel
          </button>
          {breadcrumbPath.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </>
      )}
      {breadcrumbPath.map((cat, index) => (
        <React.Fragment key={cat.category_id}>
          {index > 0 && <ChevronRight className="w-3.5 h-3.5" />}
          <button
            onClick={() => navigate(`/articles?category=${cat.category_id}`)}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            {index === 0 && <FolderTree className="w-3 h-3" />}
            {cat.name}
          </button>
        </React.Fragment>
      ))}
      {article && (
        <>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {article.title}
          </span>
        </>
      )}
    </div>
  );
};

// Compact breadcrumb for cards (only shows category path)
export const CompactBreadcrumb = ({ 
  categoryIds = [], 
  categories = [],
  className = "" 
}) => {
  const navigate = useNavigate();
  
  // Get first category if multiple
  const categoryId = categoryIds?.[0];
  const breadcrumbPath = buildCategoryPath(categoryId, categories);
  
  if (breadcrumbPath.length === 0) return null;
  
  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground truncate ${className}`}>
      <FolderTree className="w-3 h-3 shrink-0" />
      {breadcrumbPath.map((cat, index) => (
        <React.Fragment key={cat.category_id}>
          {index > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/articles?category=${cat.category_id}`);
            }}
            className="hover:text-foreground transition-colors truncate"
          >
            {cat.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ArticleBreadcrumb;

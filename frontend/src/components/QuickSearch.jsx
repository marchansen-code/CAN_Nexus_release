import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  FileText, 
  Folder, 
  Search, 
  Users, 
  Settings, 
  FolderTree,
  Home,
  File,
  Tag,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const QuickSearch = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    articles: [],
    documents: [],
    categories: []
  });
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all categories for breadcrumb building
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API}/categories`);
        setAllCategories(res.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Build breadcrumb path for an article based on its category
  const buildBreadcrumb = useCallback((categoryIds) => {
    if (!categoryIds || categoryIds.length === 0 || allCategories.length === 0) return null;
    
    // Take the first category
    const categoryId = categoryIds[0];
    const category = allCategories.find(c => c.category_id === categoryId);
    if (!category) return null;
    
    // Build path from root to this category
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current.name);
      if (current.parent_id) {
        current = allCategories.find(c => c.category_id === current.parent_id);
      } else {
        current = null;
      }
    }
    
    return path;
  }, [allCategories]);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchAll = async () => {
      if (!query || query.length < 2) {
        setResults({ articles: [], documents: [], categories: [] });
        return;
      }

      setLoading(true);
      try {
        const [articlesRes, documentsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/articles/search?q=${encodeURIComponent(query)}&limit=5`),
          axios.get(`${API}/documents?search=${encodeURIComponent(query)}&limit=5`),
          axios.get(`${API}/categories`)
        ]);

        // Filter categories locally
        const filteredCategories = categoriesRes.data.filter(cat => 
          cat.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        setResults({
          articles: articlesRes.data?.articles || articlesRes.data || [],
          documents: documentsRes.data || [],
          categories: filteredCategories
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = useCallback((type, item) => {
    setOpen(false);
    setQuery('');
    
    switch (type) {
      case 'article':
        navigate(`/articles/${item.article_id}`);
        break;
      case 'document':
        navigate(`/documents?id=${item.document_id}`);
        break;
      case 'category':
        navigate(`/articles?category=${item.category_id}`);
        break;
      case 'page':
        navigate(item.path);
        break;
      default:
        break;
    }
  }, [navigate]);

  // Quick navigation pages
  const quickPages = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Artikel', path: '/articles', icon: FileText },
    { name: 'Dokumente', path: '/documents', icon: File },
    { name: 'Kategorien', path: '/categories', icon: FolderTree },
    { name: 'Benutzer', path: '/users', icon: Users },
    { name: 'Einstellungen', path: '/settings', icon: Settings },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700',
      review: 'bg-amber-100 text-amber-700',
      published: 'bg-emerald-100 text-emerald-700'
    };
    const labels = {
      draft: 'Entwurf',
      review: 'Review',
      published: 'Veröffentlicht'
    };
    return (
      <Badge variant="outline" className={`${styles[status]} text-[10px] px-1.5 py-0`}>
        {labels[status]}
      </Badge>
    );
  };

  // Breadcrumb component
  const Breadcrumb = ({ path }) => {
    if (!path || path.length === 0) return null;
    return (
      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
        {path.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-2.5 h-2.5" />}
            <span className="truncate max-w-[80px]">{item}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput 
        placeholder="Suchen... (Artikel, Dokumente, Kategorien)" 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Suche...
          </div>
        ) : (
          <>
            {/* Show "no results" only when there's a query and no results */}
            {query && query.length >= 2 && results.articles.length === 0 && results.documents.length === 0 && results.categories.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Keine Ergebnisse gefunden.
              </div>
            )}
            
            {/* Quick Navigation - Always show when no query */}
            {!query && (
              <CommandGroup heading="Schnellnavigation">
                {quickPages.map((page) => (
                  <CommandItem
                    key={page.path}
                    value={page.name}
                    onSelect={() => handleSelect('page', page)}
                  >
                    <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{page.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Articles */}
            {results.articles.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Artikel">
                  {results.articles.map((article) => {
                    const breadcrumb = buildBreadcrumb(article.category_ids);
                    return (
                      <CommandItem
                        key={article.article_id}
                        value={`article-${article.article_id}`}
                        onSelect={() => handleSelect('article', article)}
                        className="flex-col items-start"
                      >
                        <div className="flex items-center w-full">
                          <FileText className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                          <span className="flex-1 truncate">{article.title}</span>
                          {getStatusBadge(article.status)}
                        </div>
                        {breadcrumb && <Breadcrumb path={breadcrumb} />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}

            {/* Documents */}
            {results.documents.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Dokumente">
                  {results.documents.map((doc) => (
                    <CommandItem
                      key={doc.document_id}
                      value={`doc-${doc.document_id}`}
                      onSelect={() => handleSelect('document', doc)}
                      className="flex-col items-start"
                    >
                      <div className="flex items-center w-full">
                        <File className="mr-2 h-4 w-4 text-amber-500 shrink-0" />
                        <span className="flex-1 truncate">{doc.title || doc.filename}</span>
                        <span className="text-xs text-muted-foreground">
                          {doc.file_type?.toUpperCase().replace('.', '')}
                        </span>
                      </div>
                      {doc.category && (
                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                          <Folder className="w-2.5 h-2.5" />
                          <span>{doc.category}</span>
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Categories */}
            {results.categories.filter(c => isAdmin || !c.is_pinnwand).length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Kategorien">
                  {results.categories.filter(c => isAdmin || !c.is_pinnwand).map((cat) => {
                    // Build breadcrumb for category itself
                    const parentPath = [];
                    let parent = allCategories.find(c => c.category_id === cat.parent_id);
                    while (parent) {
                      parentPath.unshift(parent.name);
                      parent = allCategories.find(c => c.category_id === parent.parent_id);
                    }
                    
                    return (
                      <CommandItem
                        key={cat.category_id}
                        value={`cat-${cat.category_id}`}
                        onSelect={() => handleSelect('category', cat)}
                        className="flex-col items-start"
                      >
                        <div className="flex items-center w-full">
                          <Folder className="mr-2 h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="flex-1 truncate">{cat.name}</span>
                          {cat.is_pinnwand && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                              Pinnwand
                            </Badge>
                          )}
                        </div>
                        {parentPath.length > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                            {parentPath.map((item, index) => (
                              <React.Fragment key={index}>
                                {index > 0 && <ChevronRight className="w-2.5 h-2.5" />}
                                <span className="truncate max-w-[80px]">{item}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default QuickSearch;

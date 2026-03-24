import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  Tag
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
  const [loading, setLoading] = useState(false);

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
                  {results.articles.map((article) => (
                    <CommandItem
                      key={article.article_id}
                      value={`article-${article.article_id}`}
                      onSelect={() => handleSelect('article', article)}
                    >
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="flex-1 truncate">{article.title}</span>
                      {getStatusBadge(article.status)}
                    </CommandItem>
                  ))}
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
                    >
                      <File className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="flex-1 truncate">{doc.title || doc.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.file_type?.toUpperCase()}
                      </span>
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
                  {results.categories.filter(c => isAdmin || !c.is_pinnwand).map((cat) => (
                    <CommandItem
                      key={cat.category_id}
                      value={`cat-${cat.category_id}`}
                      onSelect={() => handleSelect('category', cat)}
                    >
                      <Folder className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="flex-1 truncate">{cat.name}</span>
                      {cat.is_pinnwand && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                          Pinnwand
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
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

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  FolderTree,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Eye,
  Star,
  User,
  History,
  Pin,
  LayoutDashboard,
  Newspaper,
  Sparkles,
  Bell,
  Megaphone,
  Calendar,
  AlertCircle,
  Info,
  Gift,
  Zap,
  MessageSquare,
  Bookmark,
  AlertTriangle,
  CalendarClock,
  BookOpen,
  CheckCircle2,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <Card className="hover:shadow-float transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }) => {
  const styles = {
    draft: "status-draft",
    review: "status-review",
    published: "status-published"
  };
  
  const labels = {
    draft: "Entwurf",
    review: "Review",
    published: "Veröffentlicht"
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border`}>
      {labels[status]}
    </Badge>
  );
};

const ArticleCard = ({ article, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
      data-testid={`article-card-${article.article_id}`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <p className="font-medium truncate">{article.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDate(article.updated_at)}
        </div>
      </div>
      <StatusBadge status={article.status} />
    </div>
  );
};

// Helper function to calculate days until expiry
const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to format days remaining
const formatDaysRemaining = (days) => {
  if (days <= 0) return "Heute";
  if (days === 1) return "Morgen";
  return `${days} Tage`;
};

// Expiring Article Card with urgency styling
const ExpiringArticleCard = ({ article, onClick }) => {
  const daysRemaining = getDaysUntilExpiry(article.expiry_date);
  
  // Determine urgency level
  let urgencyClass = "border-l-amber-500 bg-amber-50 dark:bg-amber-900/20";
  let badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200";
  let iconColor = "text-amber-500";
  
  if (daysRemaining <= 3) {
    urgencyClass = "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    badgeClass = "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200";
    iconColor = "text-red-500";
  } else if (daysRemaining <= 7) {
    urgencyClass = "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
    badgeClass = "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200";
    iconColor = "text-orange-500";
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${urgencyClass} hover:opacity-90 transition-all cursor-pointer`}
      onClick={onClick}
      data-testid={`expiring-article-${article.article_id}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <CalendarClock className={`w-5 h-5 ${iconColor} shrink-0`} />
        <div className="space-y-1 min-w-0">
          <p className="font-medium truncate">{article.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ablauf: {formatDate(article.expiry_date)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Badge className={`${badgeClass} text-xs font-semibold`}>
          {daysRemaining <= 0 ? "Heute!" : `Noch ${formatDaysRemaining(daysRemaining)}`}
        </Badge>
      </div>
    </div>
  );
};

// Reading Assignment Card - shows unread articles assigned to user
const ReadingAssignmentCard = ({ article, onMarkAsRead, onView }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
      data-testid={`reading-assignment-${article.article_id}`}
    >
      <div 
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onClick={onView}
      >
        <div className="relative">
          <BookOpen className="w-5 h-5 text-orange-500 shrink-0" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="font-medium truncate">{article.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Von {article.assigned_by_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(article.assigned_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200 text-xs font-semibold">
          Ungelesen
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          data-testid={`mark-read-${article.article_id}`}
          title="Als gelesen markieren"
        >
          <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Pinnwand Article Row - simple one-line display
const PinnwandArticleRow = ({ article, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div
      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0"
      onClick={onClick}
      data-testid={`pinnwand-article-${article.article_id}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {article.is_important && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Wichtig</Badge>
        )}
        <span className="font-medium truncate">{article.title}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(article.updated_at)}
        </span>
        {article.view_count > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.view_count}
          </span>
        )}
      </div>
    </div>
  );
};

// Pinnwand Article Card with more details
const PinnwandArticleCard = ({ article, onClick, categoryName }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-amber-500"
      onClick={onClick}
      data-testid={`pinnwand-article-${article.article_id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {article.is_important && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Wichtig</Badge>
              )}
              {categoryName && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{categoryName}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-base truncate">{article.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(article.updated_at)}
              </span>
              {article.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.view_count}
                </span>
              )}
            </div>
          </div>
          <Pin className="w-5 h-5 text-amber-500 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [pinnwandArticles, setPinnwandArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [readingAssignments, setReadingAssignments] = useState([]);
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "pinnwand" : "dashboard");

  const fetchReadingAssignments = async () => {
    try {
      const res = await axios.get(`${API}/reading-assignments/my-assignments`);
      setReadingAssignments(res.data.assignments || []);
    } catch (error) {
      console.error("Failed to fetch reading assignments:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, pinnwandRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/stats`),
          axios.get(`${API}/categories/pinnwand/articles`),
          axios.get(`${API}/categories`)
        ]);
        setStats(statsRes.data);
        setPinnwandArticles(pinnwandRes.data);
        setCategories(categoriesRes.data);
        
        // Fetch reading assignments
        await fetchReadingAssignments();
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Daten konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mark article as read
  const handleMarkAsRead = async (articleId) => {
    try {
      await axios.post(`${API}/reading-assignments/mark-as-read`, { article_id: articleId });
      toast.success("Artikel als gelesen markiert");
      // Remove from local state
      setReadingAssignments(prev => prev.filter(a => a.article_id !== articleId));
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Fehler beim Markieren");
    }
  };

  // Get Pinnwand categories and group articles by category
  const pinnwandCategories = categories.filter(c => c.is_pinnwand);
  
  // Get icon for Pinnwand category title
  const getPinnwandIcon = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('news') || titleLower.includes('neuigkeit')) return Newspaper;
    if (titleLower.includes('special') || titleLower.includes('angebot')) return Sparkles;
    if (titleLower.includes('wichtig') || titleLower.includes('alert') || titleLower.includes('achtung')) return AlertCircle;
    if (titleLower.includes('info') || titleLower.includes('hinweis')) return Info;
    if (titleLower.includes('event') || titleLower.includes('termin') || titleLower.includes('kalender')) return Calendar;
    if (titleLower.includes('ankündigung') || titleLower.includes('announce')) return Megaphone;
    if (titleLower.includes('aktion') || titleLower.includes('promo')) return Gift;
    if (titleLower.includes('tipp') || titleLower.includes('tip')) return Zap;
    if (titleLower.includes('feedback') || titleLower.includes('kommentar')) return MessageSquare;
    if (titleLower.includes('merken') || titleLower.includes('bookmark')) return Bookmark;
    if (titleLower.includes('bell') || titleLower.includes('benachrichtigung')) return Bell;
    return Pin; // Default icon
  };
  
  // Group articles by Pinnwand category
  const articlesByCategory = React.useMemo(() => {
    const grouped = {};
    pinnwandCategories.forEach(cat => {
      grouped[cat.category_id] = {
        category: cat,
        // Extract second word from category name (e.g., "Pinnwand NEWS" → "NEWS")
        title: cat.name.split(' ').slice(1).join(' ') || cat.name,
        articles: pinnwandArticles.filter(article => 
          article.category_ids?.includes(cat.category_id)
        )
      };
    });
    return grouped;
  }, [pinnwandCategories, pinnwandArticles]);

  // Helper to get category name
  const getCategoryName = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return null;
    const cat = categories.find(c => categoryIds.includes(c.category_id) && c.is_pinnwand);
    return cat?.name || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Willkommen, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Hier ist eine Übersicht Ihrer Wissensdatenbank
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role !== "viewer" && (
          <Button onClick={() => navigate("/articles/new")} className="bg-primary hover:bg-primary/90" data-testid="new-article-btn">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Artikel
          </Button>
          )}
        </div>
      </div>

      {/* Main Tabs: Pinnwand / Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full max-w-md ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {isAdmin && (
          <TabsTrigger value="pinnwand" className="flex items-center gap-2" data-testid="pinnwand-tab">
            <Pin className="w-4 h-4" />
            Pinnwand
          </TabsTrigger>
          )}
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="dashboard-tab">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Pinnwand Tab */}
        <TabsContent value="pinnwand" className="mt-6">
          {pinnwandCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.values(articlesByCategory).map(({ category, title, articles }) => {
                const IconComponent = getPinnwandIcon(title);
                return (
                  <Card key={category.category_id} className="border-l-4 border-l-amber-500 h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconComponent className="w-5 h-5 text-amber-500" />
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {articles.length > 0 ? (
                        <div className="divide-y rounded-lg border">
                          {articles.map((article) => (
                            <PinnwandArticleRow
                              key={article.article_id}
                              article={article}
                              onClick={() => navigate(`/articles/${article.article_id}`)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">Keine Artikel</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Keine Pinnwand-Kategorien</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Artikel erscheinen hier, wenn sie einer Pinnwand-Kategorie zugewiesen sind. 
                  Admins können Kategorien unter "Kategorien" als Pinnwand markieren.
                </p>
                {user?.role === "admin" && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/categories")}
                  >
                    <FolderTree className="w-4 h-4 mr-2" />
                    Kategorien verwalten
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* Reading Assignments Section */}
          {readingAssignments.length > 0 && (
            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20 dark:to-transparent" data-testid="reading-assignments-section">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  <span>Leseaufgaben</span>
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200 animate-pulse">
                    {readingAssignments.length} Ungelesen
                  </Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Artikel, die Sie lesen und bestätigen sollen
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {readingAssignments.map((article) => (
                    <ReadingAssignmentCard
                      key={article.article_id}
                      article={article}
                      onView={() => navigate(`/articles/${article.article_id}`)}
                      onMarkAsRead={() => handleMarkAsRead(article.article_id)}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Klicken Sie auf "✓", um einen Artikel als gelesen zu markieren und aus dieser Liste zu entfernen.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Expiring Articles Warning Section */}
          {stats?.expiring_articles?.length > 0 && (
            <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent" data-testid="expiring-articles-section">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Bald ablaufende Artikel</span>
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200">
                    {stats.expiring_articles.length}
                  </Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Ihre Artikel mit Ablaufdatum in den nächsten 14 Tagen
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.expiring_articles.map((article) => (
                    <ExpiringArticleCard
                      key={article.article_id}
                      article={article}
                      onClick={() => navigate(`/articles/${article.article_id}/edit`)}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Klicken Sie auf einen Artikel, um das Ablaufdatum zu verlängern oder den Artikel zu bearbeiten.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Favorites Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Favoriten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.favorite_articles?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.favorite_articles.slice(0, 6).map((article) => (
                    <ArticleCard
                      key={article.article_id}
                      article={article}
                      onClick={() => navigate(`/articles/${article.article_id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Keine Favoriten</p>
                  <p className="text-xs">Markieren Sie Artikel mit dem Stern-Symbol</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Viewed Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Zuletzt angesehen
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {stats?.recently_viewed?.length || 0} Artikel
              </span>
            </CardHeader>
            <CardContent>
              {stats?.recently_viewed?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recently_viewed.slice(0, 6).map((article) => (
                    <ArticleCard
                      key={article.article_id}
                      article={article}
                      onClick={() => navigate(`/articles/${article.article_id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Keine Ansichten</p>
                  <p className="text-xs">Öffnen Sie Artikel zum Anzeigen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Articles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Neueste Artikel</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/articles")} data-testid="view-all-articles-btn">
                Alle anzeigen
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {stats?.recent_articles?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recent_articles.map((article) => (
                    <ArticleCard
                      key={article.article_id}
                      article={article}
                      onClick={() => navigate(`/articles/${article.article_id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Noch keine Artikel vorhanden</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/articles/new")}
                  >
                    Ersten Artikel erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Artikel gesamt"
              value={stats?.total_articles || 0}
              icon={FileText}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              title="Veröffentlicht"
              value={stats?.published_articles || 0}
              icon={Eye}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Kategorien"
              value={stats?.total_categories || 0}
              icon={FolderTree}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              title="Dokumente"
              value={stats?.total_documents || 0}
              trend={stats?.pending_documents > 0 ? `${stats.pending_documents} in Verarbeitung` : undefined}
              icon={Upload}
              color="bg-slate-100 text-slate-600"
            />
          </div>

          {/* User Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Ihre Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-3xl font-bold">{stats?.user_stats?.articles_created || 0}</p>
                    <p className="text-sm text-muted-foreground">Artikel erstellt</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats?.user_stats?.documents_uploaded || 0}</p>
                    <p className="text-sm text-muted-foreground">PDFs hochgeladen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Popular Articles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Beliebteste Artikel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.top_articles?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.top_articles.map((article, index) => (
                    <div
                      key={article.article_id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/articles/${article.article_id}`)}
                    >
                      <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count || 0} Aufrufe
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Noch keine Daten</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Entwürfe</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.draft_articles || 0}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div 
                      className="h-2 bg-slate-500 rounded-full transition-all"
                      style={{ width: `${stats?.total_articles ? (stats.draft_articles / stats.total_articles) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">In Review</span>
                    <span className="text-2xl font-bold text-amber-900 dark:text-amber-200">{stats?.review_articles || 0}</span>
                  </div>
                  <div className="h-2 bg-amber-200 dark:bg-amber-800 rounded-full">
                    <div 
                      className="h-2 bg-amber-500 rounded-full transition-all"
                      style={{ width: `${stats?.total_articles ? (stats.review_articles / stats.total_articles) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Veröffentlicht</span>
                    <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{stats?.published_articles || 0}</span>
                  </div>
                  <div className="h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                    <div 
                      className="h-2 bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stats?.total_articles ? (stats.published_articles / stats.total_articles) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

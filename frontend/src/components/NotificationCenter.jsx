import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { 
  Bell, 
  BookOpen, 
  MessageSquare, 
  AlertTriangle, 
  Check,
  Clock,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Fetch reading assignments, expiring articles and expired articles
      const [readingRes, statsRes] = await Promise.all([
        axios.get(`${API}/reading-assignments/my-assignments`),
        axios.get(`${API}/stats`)
      ]);

      const notifs = [];

      // Reading assignments
      const readingAssignments = readingRes.data.assignments || [];
      readingAssignments.forEach(assignment => {
        notifs.push({
          id: `reading-${assignment.article_id}`,
          type: 'reading',
          title: 'Leseaufgabe',
          message: assignment.article_title,
          articleId: assignment.article_id,
          assignedBy: assignment.assigned_by_name,
          date: assignment.assigned_at,
          icon: BookOpen,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        });
      });

      // Expiring articles (within 14 days)
      const expiringArticles = statsRes.data.expiring_articles || [];
      expiringArticles.slice(0, 5).forEach(article => {
        const daysRemaining = Math.ceil((new Date(article.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        notifs.push({
          id: `expiring-${article.article_id}`,
          type: 'expiring',
          title: daysRemaining <= 3 ? 'Dringend: Artikel läuft ab!' : 'Artikel läuft bald ab',
          message: article.title,
          articleId: article.article_id,
          daysRemaining,
          date: article.expiry_date,
          icon: AlertTriangle,
          color: daysRemaining <= 3 ? 'text-red-500' : 'text-amber-500',
          bgColor: daysRemaining <= 3 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
        });
      });

      // Expired articles
      const expiredArticles = statsRes.data.expired_articles || [];
      expiredArticles.slice(0, 3).forEach(article => {
        notifs.push({
          id: `expired-${article.article_id}`,
          type: 'expired',
          title: 'Artikel abgelaufen',
          message: article.title,
          articleId: article.article_id,
          daysExpired: article.days_expired || 0,
          date: article.expiry_date,
          icon: Clock,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        });
      });

      setNotifications(notifs);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  // Navigate to article and store origin
  const handleNotificationClick = (notification) => {
    sessionStorage.setItem('article_origin_url', window.location.pathname);
    
    if (notification.type === 'reading') {
      navigate(`/articles/${notification.articleId}`);
    } else {
      navigate(`/articles/${notification.articleId}/edit`);
    }
    setOpen(false);
  };

  // Mark reading assignment as read
  const handleMarkAsRead = async (e, articleId) => {
    e.stopPropagation();
    try {
      await axios.post(`${API}/reading-assignments/mark-as-read`, { article_id: articleId });
      setNotifications(prev => prev.filter(n => n.id !== `reading-${articleId}`));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Dismiss expired notification
  const handleDismissExpired = async (e, articleId) => {
    e.stopPropagation();
    try {
      await axios.post(`${API}/stats/dismiss-expired`, { article_ids: [articleId] });
      setNotifications(prev => prev.filter(n => n.id !== `expired-${articleId}`));
    } catch (error) {
      console.error("Failed to dismiss:", error);
    }
  };

  const totalCount = notifications.length;
  const readingCount = notifications.filter(n => n.type === 'reading').length;
  const alertCount = notifications.filter(n => n.type === 'expiring' || n.type === 'expired').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="notification-center-btn"
        >
          <Bell className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" data-testid="notification-panel">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Benachrichtigungen
            </h3>
            <div className="flex gap-2">
              {readingCount > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {readingCount}
                </Badge>
              )}
              {alertCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {alertCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Keine Benachrichtigungen</p>
              <p className="text-xs">Sie sind auf dem neuesten Stand!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${notification.bgColor}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-background ${notification.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${notification.color}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1">
                            {notification.type === 'reading' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleMarkAsRead(e, notification.articleId)}
                                title="Als gelesen markieren"
                              >
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              </Button>
                            )}
                            {notification.type === 'expired' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleDismissExpired(e, notification.articleId)}
                                title="Ausblenden"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground truncate">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {notification.type === 'reading' && notification.assignedBy && (
                            <span>Von {notification.assignedBy}</span>
                          )}
                          {notification.type === 'expiring' && (
                            <span>Noch {notification.daysRemaining} {notification.daysRemaining === 1 ? 'Tag' : 'Tage'}</span>
                          )}
                          {notification.type === 'expired' && (
                            <span>Seit {notification.daysExpired} {notification.daysExpired === 1 ? 'Tag' : 'Tagen'} abgelaufen</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => {
              navigate("/dashboard");
              setOpen(false);
            }}
          >
            Alle anzeigen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;

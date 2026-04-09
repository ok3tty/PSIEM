import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'alert': return <XCircle className="w-4 h-4 text-destructive" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
    default: return <Info className="w-4 h-4 text-info" />;
  }
};

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Query Elasticsearch for recent IDS alerts
      const response = await axios.post('/elasticsearch/siem-ids-*/_search', {
        size: 10,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: {
          range: {
            '@timestamp': {
              gte: 'now-24h'
            }
          }
        }
      });

      const alerts = response.data.hits.hits.map((hit: any, index: number) => {
        const alert = hit._source.alert || {};
        const severity = alert.severity || 3;
        
        return {
          id: hit._id,
          type: severity === 1 ? 'alert' : severity === 2 ? 'warning' : 'info',
          title: alert.signature || 'Security Alert',
          message: `${alert.category || 'Unknown'} - ${alert.action || 'detected'}`,
          timestamp: new Date(hit._source['@timestamp']),
          read: false
        };
      });

      setNotifications(alerts);
      setUnreadCount(alerts.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Fallback to mock notifications if Elasticsearch fails
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'alert',
          title: 'High CPU Usage Detected',
          message: 'System CPU usage exceeded 85%',
          timestamp: new Date(Date.now() - 5 * 60000),
          read: false
        },
        {
          id: '2',
          type: 'warning',
          title: 'Unusual Login Attempt',
          message: 'Login attempt from unknown IP address',
          timestamp: new Date(Date.now() - 15 * 60000),
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Database Connection Spike',
          message: 'Connection pool usage increased by 40%',
          timestamp: new Date(Date.now() - 30 * 60000),
          read: false
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.length);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm line-clamp-1">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-sm text-primary cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

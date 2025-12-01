import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  Shield,
  ScrollText,
  Bot,
  Activity,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Password Manager', url: '/password-manager', icon: KeyRound },
  { title: 'Intrusion Detection', url: '/intrusion-detection', icon: Shield },
  { title: 'Event Logs', url: '/event-logs', icon: ScrollText },
  { title: 'AI Assistant', url: '/ai-assistant', icon: Bot },
  { title: 'System Health', url: '/system-health', icon: Activity },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isCollapsed = state === 'collapsed';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-purple-sm">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">AEGIS SIEM</span>
              <span className="text-xs text-muted-foreground">Security Dashboard</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground px-4 mb-2">
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth hover:bg-sidebar-accent"
                        activeClassName="bg-primary/20 text-primary font-medium glow-purple-sm"
                      >
                        <item.icon className="w-5 h-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                        {isActive && !isCollapsed && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-destructive/20 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
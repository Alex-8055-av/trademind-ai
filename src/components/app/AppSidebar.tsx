import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Radar, Filter, Grid3x3, PieChart, Activity, Boxes, LineChart,
  Newspaper, CalendarDays, Wallet, Star, BellRing, BookOpen, TrendingUp, Shield,
  Settings, LogOut, CandlestickChart,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/app", icon: LayoutDashboard, exact: true },
      { title: "AI Chart", to: "/chart", icon: CandlestickChart },
    ],
  },
  {
    label: "Markets",
    items: [
      { title: "AI Scanner", to: "/app/scanner", icon: Radar },
      { title: "Screener", to: "/app/screener", icon: Filter },
      { title: "Heatmap", to: "/app/heatmap", icon: Grid3x3 },
      { title: "Sectors", to: "/app/sectors", icon: PieChart },
      { title: "Breadth", to: "/app/breadth", icon: Activity },
    ],
  },
  {
    label: "Derivatives & Flows",
    items: [
      { title: "Options", to: "/app/options", icon: Boxes },
      { title: "FII / DII", to: "/app/fii-dii", icon: LineChart },
      { title: "News", to: "/app/news", icon: Newspaper },
      { title: "Calendar", to: "/app/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Portfolio", to: "/app/portfolio", icon: Wallet },
      { title: "Paper Trading", to: "/app/paper", icon: CandlestickChart },
      { title: "Strategies", to: "/app/strategies", icon: Boxes },
      { title: "Backtest", to: "/app/backtest", icon: Activity },
      { title: "Watchlist", to: "/app/watchlist", icon: Star },
      { title: "Alerts", to: "/app/alerts", icon: BellRing },
      { title: "Trade Journal", to: "/app/journal", icon: BookOpen },
      { title: "Performance", to: "/app/performance", icon: TrendingUp },
      { title: "Risk", to: "/app/risk", icon: Shield },
    ],
  },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isActive = (to: string, exact?: boolean) => exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const onSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="px-3 py-4">
        {!collapsed ? <Logo /> : <div className="text-emerald text-xl font-bold text-center">TM</div>}
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to, "exact" in item ? item.exact : false)}>
                      <Link to={item.to} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/app/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, languageLabels, Language } from "@/contexts/LanguageContext";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Menu, X, Home, PlusCircle, List, Trophy, LogOut, BarChart3, Users, AlertTriangle, Map, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ReactNode;
}

const citizenNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/citizen", icon: <Home className="h-4 w-4" /> },
  { labelKey: "nav.submit", href: "/citizen/submit", icon: <PlusCircle className="h-4 w-4" /> },
  { labelKey: "nav.myIssues", href: "/citizen/issues", icon: <List className="h-4 w-4" /> },
  { labelKey: "nav.leaderboard", href: "/citizen/leaderboard", icon: <Trophy className="h-4 w-4" /> },
];

const authorityNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/authority", icon: <Home className="h-4 w-4" /> },
  { labelKey: "Issue Queue", href: "/authority/queue", icon: <List className="h-4 w-4" /> },
  { labelKey: "Performance", href: "/authority/stats", icon: <BarChart3 className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/admin", icon: <Home className="h-4 w-4" /> },
  { labelKey: "Map View", href: "/admin/map", icon: <Map className="h-4 w-4" /> },
  { labelKey: "Departments", href: "/admin/departments", icon: <Users className="h-4 w-4" /> },
  { labelKey: "Authorities", href: "/admin/authorities", icon: <Shield className="h-4 w-4" /> },
  { labelKey: "Performance", href: "/admin/performance", icon: <BarChart3 className="h-4 w-4" /> },
  { labelKey: "Escalations", href: "/admin/escalations", icon: <AlertTriangle className="h-4 w-4" /> },
  { labelKey: "Leaderboard", href: "/admin/leaderboard", icon: <Trophy className="h-4 w-4" /> },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = role === "admin" ? adminNav : role === "authority" ? authorityNav : citizenNav;

  const getLabel = (item: NavItem) => {
    // If key exists in translations, use t(); otherwise use it as-is (for admin/authority english-only labels)
    const translated = t(item.labelKey);
    return translated !== item.labelKey ? translated : item.labelKey;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/90 text-sidebar-foreground transform transition-all duration-500 ease-out lg:translate-x-0 lg:static shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-sidebar-border/50">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25 animate-pulse-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">ResolvIt</span>
            <button className="ml-auto lg:hidden hover:rotate-90 transition-transform duration-300" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-base transition-all duration-300 group/nav relative overflow-hidden",
                  location.pathname === item.href
                    ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-sidebar-primary font-medium shadow-md shadow-primary/10 border border-primary/20"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:translate-x-1 hover:shadow-sm"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className={cn(
                  "transition-all duration-300",
                  location.pathname === item.href ? "scale-110 text-primary" : "group-hover/nav:scale-110"
                )}>
                  {item.icon}
                </span>
                <span className="relative">
                  {getLabel(item)}
                  {location.pathname === item.href && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                  )}
                </span>
                {location.pathname === item.href && (
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary animate-bounce-subtle" />
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border/50">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/30 backdrop-blur-sm">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/25 ring-2 ring-primary/20">
                {profile?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.name || t("common.user")}</p>
                <p className="text-xs text-sidebar-foreground/40 capitalize font-medium">{role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2.5 text-sidebar-foreground/50 hover:text-white hover:bg-destructive/90 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-destructive/20 group/signout"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2 group-hover/signout:-translate-x-0.5 transition-transform" />
              {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass-strong border-b border-border/50 px-4 py-3 flex items-center gap-4 shadow-sm">
          <button className="lg:hidden hover:bg-muted/80 rounded-xl p-2 transition-all duration-200 active:scale-95" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-auto gap-1.5 h-9 border-none bg-muted/50 hover:bg-muted/80 rounded-xl transition-all duration-200">
              <Globe className="h-4 w-4 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(languageLabels) as Language[]).map((lang) => (
                <SelectItem key={lang} value={lang}>{languageLabels[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ThemeToggle />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
};

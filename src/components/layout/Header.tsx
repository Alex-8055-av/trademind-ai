import { Link } from "@tanstack/react-router";
import { Bell, Search, UserRound, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const navItems = [
  { label: "Markets", to: "/app/scanner" as const },
  { label: "AI Chart", to: "/chart" as const },
  { label: "Options", to: "/app/options" as const },
  { label: "Portfolio", to: "/app/portfolio" as const },
  { label: "Watchlist", to: "/app/watchlist" as const },
  { label: "Journal", to: "/app/journal" as const },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/app" className="hidden md:inline-flex items-center gap-2 rounded-full bg-emerald px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition">
            <LayoutDashboard className="h-3.5 w-3.5" /> Open Workstation
          </Link>
          <IconButton label="Search"><Search className="h-4 w-4" /></IconButton>
          <IconButton label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald" />
          </IconButton>
          <Link to="/auth" aria-label="Sign in" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground">
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button aria-label={label} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground">
      {children}
    </button>
  );
}

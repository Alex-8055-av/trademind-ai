import { Link } from "@tanstack/react-router";
import { Bell, Search, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const navItems = [
  { label: "Markets", to: "/" },
  { label: "AI Analysis", to: "/" },
  { label: "Portfolio", to: "/" },
  { label: "Watchlist", to: "/" },
  { label: "Pricing", to: "/" },
  { label: "Education", to: "/" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <IconButton label="Search"><Search className="h-4 w-4" /></IconButton>
          <IconButton label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald" />
          </IconButton>
          <IconButton label="Profile"><UserRound className="h-4 w-4" /></IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}

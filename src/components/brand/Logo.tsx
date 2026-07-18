import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link
      to="/"
      className="group flex flex-col leading-none transition-transform duration-300 hover:scale-[1.05]"
      aria-label="TradeMind AI by Avinash — Home"
    >
      <span
        className="font-display text-xl font-bold tracking-tight text-foreground transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_rgba(34,197,94,0.55))]"
      >
        TradeMind <span className="text-emerald">AI</span>
      </span>
      <span className="text-brand-gradient mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 group-hover:[background-position:100%_0]">
        by Avinash
      </span>
    </Link>
  );
}

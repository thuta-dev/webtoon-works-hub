import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AppNavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

export function AppNavLink({ to, icon: Icon, label }: AppNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-2 transition-all",
        isActive
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground border-foreground hover:bg-muted"
      )}
      style={{ boxShadow: isActive ? 'none' : 'var(--shadow-hard-sm)' }}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
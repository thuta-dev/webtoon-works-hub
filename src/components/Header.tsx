import { Palette, LayoutDashboard, Puzzle, Scissors } from 'lucide-react';
import { AppNavLink } from './AppNavLink';
export function Header() {
  return <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-foreground bg-foreground flex items-center justify-center" style={{
          boxShadow: 'var(--shadow-hard-sm)'
        }}>
            <Palette className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Typesetting Team Super App</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          <AppNavLink to="/" icon={LayoutDashboard} label="Tracker" />
          <AppNavLink to="/combiner" icon={Puzzle} label="Combiner" />
          <AppNavLink to="/cropper" icon={Scissors} label="Cropper" />
        </nav>
      </div>
    </header>;
}
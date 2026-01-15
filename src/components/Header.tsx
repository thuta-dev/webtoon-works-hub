import { Palette } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-foreground bg-foreground flex items-center justify-center" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
            <Palette className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Webtoon Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Typesetting Team Work Tracker</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground border-2 border-foreground px-3 py-1.5 bg-background" style={{ boxShadow: 'var(--shadow-hard-sm)' }}>
          <span className="w-2 h-2 bg-foreground" />
          Live Tracking
        </div>
      </div>
    </header>
  );
}

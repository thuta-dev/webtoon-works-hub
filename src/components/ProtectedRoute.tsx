import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from './Header';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div 
          className={`card-notion p-8 w-full max-w-md ${shake ? 'animate-shake' : ''}`}
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <div 
              className="w-16 h-16 border-2 border-foreground bg-foreground flex items-center justify-center"
              style={{ boxShadow: 'var(--shadow-hard-sm)' }}
            >
              <Lock className="w-8 h-8 text-background" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Access Required</h2>
            <p className="text-muted-foreground text-center">
              Enter password to access tools
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border-2 border-destructive text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Wrong password. Access denied.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="input-notion"
              autoFocus
            />
            <Button 
              type="submit" 
              className="w-full btn-notion bg-foreground text-background hover:bg-foreground"
            >
              Unlock Access
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

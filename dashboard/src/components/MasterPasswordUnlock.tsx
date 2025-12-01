import { useState } from 'react';
import { Shield, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validateMasterPassword } from '@/lib/encryption';

interface MasterPasswordUnlockProps {
  onUnlock: (masterPassword: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function MasterPasswordUnlock({ onUnlock, isLoading = false }: MasterPasswordUnlockProps) {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!masterPassword) {
      setError('Please enter your master password');
      return;
    }

    setIsVerifying(true);
    try {
      const success = await onUnlock(masterPassword);
      if (!success) {
        setError('Incorrect master password. Please try again.');
        setMasterPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault');
      setMasterPassword('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md glass-card glow-purple">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center glow-purple">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Unlock Password Vault</CardTitle>
            <CardDescription className="mt-2">
              Enter your master password to access your encrypted passwords
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <div className="relative">
                <Input
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                  disabled={isVerifying || isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isVerifying || isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 glow-purple"
              disabled={isVerifying || isLoading || !masterPassword}
            >
              {isVerifying || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Vault
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-info/10 border border-info/30">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Security Notice</p>
                <p>Your master password is never sent to our servers. All encryption happens locally in your browser.</p>
                <p className="text-warning">If you forget your master password, your encrypted passwords cannot be recovered.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
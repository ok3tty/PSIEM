import { useState } from 'react';
import { Shield, Lock, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validateMasterPassword } from '@/lib/encryption';

interface MasterPasswordSetupProps {
  onSetup: (masterPassword: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function MasterPasswordSetup({ onSetup, isLoading = false }: MasterPasswordSetupProps) {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const validation = validateMasterPassword(masterPassword);
  const passwordsMatch = masterPassword === confirmPassword && confirmPassword.length > 0;

  const requirements = [
    { met: masterPassword.length >= 12, text: 'At least 12 characters' },
    { met: /[A-Z]/.test(masterPassword), text: 'One uppercase letter' },
    { met: /[a-z]/.test(masterPassword), text: 'One lowercase letter' },
    { met: /[0-9]/.test(masterPassword), text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(masterPassword), text: 'One special character' },
    { met: passwordsMatch, text: 'Passwords match' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!masterPassword || !confirmPassword) {
      setError('Please enter and confirm your master password');
      return;
    }

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);
    try {
      const success = await onSetup(masterPassword);
      if (!success) {
        setError('Failed to setup master password. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup vault');
    } finally {
      setIsCreating(false);
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
            <CardTitle className="text-2xl font-bold">Create Master Password</CardTitle>
            <CardDescription className="mt-2">
              Set up your master password to secure your vault
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
                  placeholder="Create a strong master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                  disabled={isCreating || isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isCreating || isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Master Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  disabled={isCreating || isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isCreating || isLoading}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Password Requirements:</p>
              <div className="space-y-1">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-success text-success-foreground' : 'bg-muted border border-border'}`}>
                      {req.met && <Check className="w-3 h-3" />}
                    </div>
                    <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                      {req.text}
                    </span>
                  </div>
                ))}
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
              disabled={isCreating || isLoading || !validation.valid || !passwordsMatch}
            >
              {isCreating || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Vault...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Create Vault
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-warning">Important Notice</p>
                <p className="text-foreground">Your master password cannot be recovered if forgotten. Make sure to:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Store it in a safe place</li>
                  <li>Use a password you can remember</li>
                  <li>Never share it with anyone</li>
                </ul>
                <p className="text-warning mt-2">All your encrypted passwords will be permanently lost if you forget this password.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

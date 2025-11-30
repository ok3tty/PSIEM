import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome to PSIEM Security Dashboard'
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Please check your credentials and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }} />
      </div>

      <Card className="w-full max-w-md glass-card relative z-10 glow-purple">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center glow-purple">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">AEGIS</CardTitle>
            <CardDescription className="mt-2">
              Personal Security Information & Event Management
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="security@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background/50" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 glow-purple" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </> : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-info/10 border border-info/30">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Mock Authentication - Keycloak integration placeholder
              <br />
              <span className="text-info">Enter any credentials to continue</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
}
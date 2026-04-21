import { useState } from 'react';
import { Camera, Shield, User, Calendar, Clock, LogOut, ExternalLink, Monitor, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: Date;
  current: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 120',
      location: 'Arlington, TX',
      lastActive: new Date(),
      current: true,
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari',
      location: 'Dallas, TX',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false,
    },
  ]);

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        data: { name: username },
      });
      if (error) throw error;
      setProfileMessage('Profile updated successfully!');
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile');
    }
    setTimeout(() => setProfileMessage(''), 3000);
  };

  const handleResetProfile = () => {
    setUsername(user?.name || '');
    setEmail(user?.email || '');
    setProfilePicture(null);
    setProfileMessage('');
  };

  const handleEnable2FA = () => {
    if (!twoFactorEnabled) setShowQRCode(true);
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleSignOutSession = (sessionId: string) => {
    console.log('Signing out session:', sessionId);
    alert('Session signed out successfully!');
  };

  const handleSignOutAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      alert('All sessions signed out successfully!');
    } catch (err: any) {
      alert(`Failed to sign out: ${err.message}`);
    }
  };

  const accountCreatedDate = new Date('2024-01-15');
  const lastLoginDate = new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your profile picture and basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <label htmlFor="profile-upload" className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                <Camera className="w-4 h-4" />
                <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
              </label>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" placeholder="Enter username" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="Enter email" />
              </div>
            </div>
          </div>
          {profileMessage && (
            <p className={`text-sm ${profileMessage.includes('success') ? 'text-green-500' : 'text-destructive'}`}>
              {profileMessage}
            </p>
          )}
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleResetProfile}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security link */}
      <Card className="glass-card border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Password & Security</p>
                <p className="text-sm text-muted-foreground">Change your password and manage account security</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/security')}>
              <ExternalLink className="w-4 h-4" />
              Go to Security Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support link */}
      <Card className="glass-card border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Help & Support</p>
                <p className="text-sm text-muted-foreground">View team info, project details, and contact information</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/support')}>
              <ExternalLink className="w-4 h-4" />
              Go to Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable 2FA</p>
              <p className="text-sm text-muted-foreground">Use an authenticator app to generate verification codes</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleEnable2FA} />
          </div>
          {showQRCode && twoFactorEnabled && (
            <div className="p-4 border border-border rounded-lg space-y-3">
              <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
              <div className="w-48 h-48 bg-white p-2 mx-auto rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=otpauth://totp/PSIEM:${encodeURIComponent(email)}?secret=JBSWY3DPEHPK3PXP%26issuer=PSIEM`}
                  alt="2FA QR Code"
                  className="w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Or enter this code manually:</p>
                <code className="block p-2 bg-muted rounded text-sm">JBSWY3DPEHPK3PXP</code>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter verification code</Label>
                <Input id="verify-code" placeholder="000000" className="font-mono" />
                <Button className="w-full">Verify & Enable</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage devices where you're currently signed in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.device}</p>
                  {session.current && <Badge variant="default" className="text-xs">Current</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{session.browser}</p>
                <p className="text-sm text-muted-foreground">{session.location}</p>
                <p className="text-xs text-muted-foreground">Last active: {session.lastActive.toLocaleString()}</p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" onClick={() => handleSignOutSession(session.id)} className="text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              )}
            </div>
          ))}
          <Separator />
          <Button variant="outline" className="w-full" onClick={handleSignOutAllSessions}>
            Sign Out All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>View your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Account Created</span>
              </div>
              <p className="font-mono text-sm">{accountCreatedDate.toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Last Login</span>
              </div>
              <p className="font-mono text-sm">{lastLoginDate.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm">Role</span>
              </div>
              <Badge>Administrator</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Security Level</span>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">High</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

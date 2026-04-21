import { useState } from "react";
import { Key, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Security = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }
    try {
      await changePassword(newPassword);
      setPasswordMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Failed to update password.");
    }
    setTimeout(() => setPasswordMessage(""), 4000);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "DELETE") {
      alert('Type "DELETE" to confirm account deletion.');
      return;
    }
    alert("Account deletion feature coming soon.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Security Preferences</h1>
        <p className="text-muted-foreground mt-1">Manage your password and account security</p>
      </div>

      {/* Change Password */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="Confirm new password"
              />
            </div>
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.includes('success') ? 'text-green-500' : 'text-destructive'}`}>
                {passwordMessage}
              </p>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Use a strong password with at least 12 characters</p>
          <p>• Include uppercase, lowercase, numbers and symbols</p>
          <p>• Never reuse passwords across different services</p>
          <p>• Enable two-factor authentication for extra security</p>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription>This action is permanent and cannot be undone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deleting your account will remove all your data permanently. Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm.
          </p>
          <Input
            type="text"
            placeholder='Type "DELETE" here'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="border-destructive/50 focus-visible:ring-destructive/50"
          />
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE"}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Security;

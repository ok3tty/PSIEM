import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Security = () => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    try {
      await changePassword(newPassword);
      alert("Password updated successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update password.");
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "DELETE") {
      alert('Type "DELETE" to confirm account deletion.');
      return;
    }

    alert("Account deletion feature coming soon.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold">Security Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Manage your password and account security.
          </p>
        </div>

        {/* Change Password */}
        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Change Password</h2>

          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 bg-background"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 bg-background"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 bg-background"
          />

          <button
            onClick={handlePasswordChange}
            className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
          >
            Update Password
          </button>
        </div>

        {/* Delete Account */}
        <div className="border border-red-500 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-red-500">Delete Account</h2>

          <p className="text-sm text-muted-foreground">
            This action is permanent. Type DELETE to confirm.
          </p>

          <input
            type="text"
            placeholder='Type "DELETE" here'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 bg-background"
          />

          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Delete My Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default Security;

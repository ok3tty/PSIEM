import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AEGIS dashboard preferences</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Settings Page</CardTitle>
              <CardDescription>Settings and configuration options will be available here</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
  <div>
    <label className="block text-sm font-medium mb-2">Username</label>
    <input
      type="text"
      defaultValue="psiemaeg1s"
      className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">Email</label>
    <input
      type="email"
      defaultValue="psiemaeg1s@gmail.com"
      className="w-full rounded-lg bg-black border border-gray-700 px-4 py-3 text-white"
    />
  </div>

  <div className="flex gap-4">
    <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg">
      Save Changes
    </button>

    <button className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg">
      Reset
    </button>
  </div>
</div>
        </CardContent>
      </Card>
    </div>
  );
}

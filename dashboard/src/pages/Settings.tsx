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
          <div className="text-center py-12">
            <p className="text-muted-foreground">⚙️ Configuration options coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
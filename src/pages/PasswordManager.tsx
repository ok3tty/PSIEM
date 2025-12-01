import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, EyeOff, Copy, Edit, Trash2, Lock, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { passwordService, type DecryptedPasswordEntry } from '@/lib/passwordService';
import { MasterPasswordUnlock } from '@/components/MasterPasswordUnlock';
import { MasterPasswordSetup } from '@/components/MasterPasswordSetup';
import { generateSecurePassword } from '@/lib/encryption';

const PASSWORD_STORAGE_KEY = 'psiem_passwords';
const isBrowser = typeof window !== 'undefined';

type PasswordFormState = {
  name: string;
  username: string;
  password: string;
  url: string;
  category: string;
  tags: string;
};

const emptyFormState: PasswordFormState = {
  name: '',
  username: '',
  password: '',
  url: '',
  category: '',
  tags: '',
};

export default function PasswordManager() {
  const [passwords, setPasswords] = useState<DecryptedPasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PasswordFormState>(emptyFormState);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const { toast } = useToast();

  const checkFirstTimeSetup = async () => {
    setIsLoading(true);
    try {
      const hasSetup = await passwordService.hasVaultSetup();
      setIsFirstTime(!hasSetup);
    } catch (error) {
      console.error('Error checking vault setup:', error);
      setIsFirstTime(true); // Assume first time on error
    } finally {
      setIsLoading(false);
    }
  };

  // Check if this is first time setup
  useEffect(() => {
    checkFirstTimeSetup();
  }, []);

  // Load passwords when vault is unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadPasswords();
    }
  }, [isUnlocked]);

  const loadPasswords = async () => {
    setIsLoading(true);
    try {
      const data = await passwordService.fetchPasswords();
      setPasswords(data);
    } catch (error) {
      toast({
        title: 'Error loading passwords',
        description: error instanceof Error ? error.message : 'Failed to load passwords',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (masterPassword: string): Promise<boolean> => {
    try {
      passwordService.setMasterPassword(masterPassword);
      setIsFirstTime(false);
      setIsUnlocked(true);
      toast({
        title: 'Vault Created',
        description: 'Your secure password vault has been created',
      });
      return true;
    } catch (error) {
      console.error('Setup error:', error);
      return false;
    }
  }

  const handleUnlock = async (masterPassword: string): Promise<boolean> => {
    try {
      const isValid = await passwordService.verifyMasterPassword(masterPassword);
      if (isValid) {
        passwordService.setMasterPassword(masterPassword);
        setIsUnlocked(true);
        toast({
          title: 'Vault Unlocked',
          description: 'Your password vault is now accessible',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unlock error:', error);
      return false;
    }
  }

  const handleLockVault = () => {
    passwordService.clearMasterPassword();
    setIsUnlocked(false);
    setPasswords([]);
    setVisiblePasswords(new Set());
    toast({
      title: 'Vault Locked',
      description: 'Your passwords are now secured',
    });
  };

  useEffect(() => {
    // Clear master password on unmount
    return () => {
      passwordService.clearMasterPassword();
    };
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(passwords.map((pwd) => pwd.category)))],
    [passwords],
  );

  const filteredPasswords = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    const filtered = passwords.filter((pwd) => {
      const matchesCategory =
        selectedCategory === 'all' || pwd.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !term ||
        pwd.name.toLowerCase().includes(term) ||
        pwd.username.toLowerCase().includes(term) ||
        pwd.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return sorted;
  }, [passwords, searchQuery, selectedCategory, sortBy]);

  const togglePasswordVisibility = (id: string) => {
    const next = new Set(visiblePasswords);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setVisiblePasswords(next);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Clipboard is not available in this browser.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const entry = passwords.find((pwd) => pwd.id === id);
    if (!entry) return;

    const confirmed = window.confirm(`Delete ${entry.name}? This cannot be undone.`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await passwordService.deletePassword(id);
      setPasswords((prev) => prev.filter((pwd) => pwd.id !== id));
      setVisiblePasswords((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: 'Entry deleted',
        description: `${entry.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (entry?: DecryptedPasswordEntry) => {
    setEditingId(entry?.id ?? null);
    setFormState({
      name: entry?.name ?? '',
      username: entry?.username ?? '',
      password: entry?.password ?? '',
      url: entry?.url ?? '',
      category: entry?.category ?? '',
      tags: entry?.tags?.join(', ') ?? '',
    });
    setIsDialogOpen(true);
  };

  const closeEditor = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
  };

  const handleSave = async () => {
    const trimmedName = formState.name.trim();
    const trimmedUser = formState.username.trim();
    const trimmedPassword = formState.password.trim();
    const trimmedCategory = formState.category.trim();

    if (!trimmedName || !trimmedUser || !trimmedPassword || !trimmedCategory) {
      toast({
        title: 'Missing details',
        description: 'Name, username, password, and category are required.',
        variant: 'destructive',
      });
      return;
    }

    const tags = formState.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsLoading(true);
    try {
      if (editingId) {
        // Update existing password
        const updated = await passwordService.updatePassword({
          id: editingId,
          name: trimmedName,
          username: trimmedUser,
          password: trimmedPassword,
          url: formState.url.trim(),
          category: trimmedCategory,
          tags,
        });
        setPasswords((prev) => prev.map((pwd) => (pwd.id === editingId ? updated : pwd)));
        toast({
          title: 'Password updated',
          description: `${trimmedName} was updated successfully`,
        });
      } else {
        // Create new password
        const created = await passwordService.createPassword({
          name: trimmedName,
          username: trimmedUser,
          password: trimmedPassword,
          url: formState.url.trim(),
          category: trimmedCategory,
          tags,
        });
        setPasswords((prev) => [created, ...prev]);
        toast({
          title: 'Password saved',
          description: `${trimmedName} added to vault`,
        });
      }
      closeEditor();
    } catch (error) {
      toast({
        title: editingId ? 'Update failed' : 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('date');
  };

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(16);
    setFormState((prev) => ({ ...prev, password: generated }));
    toast({
      title: 'Password generated',
      description: 'A secure password has been created',
    });
  };

  // Show loading while checking first-time status
  if (isFirstTime === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    );
  }

  // Show setup screen for first-time users
  if (isFirstTime) {
    return <MasterPasswordSetup onSetup={handleSetup} isLoading={isLoading} />;
  }

  // Show unlock screen if vault is not unlocked
  if (!isUnlocked) {
    return <MasterPasswordUnlock onUnlock={handleUnlock} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Password Manager</h1>
          <p className="text-muted-foreground mt-1">
            Securely store and manage your credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLockVault} className="hidden md:flex">
            <Lock className="w-4 h-4 mr-2" />
            Lock Vault
          </Button>
          <Button variant="outline" onClick={resetFilters} className="hidden md:flex">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset filters
          </Button>
          <Button className="glow-purple-sm" onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Password
          </Button>
        </div>
      </div>

      <Card className="glass-card border-success/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-success mt-1" />
            <div>
              <p className="text-sm font-medium text-success">
                🔒 End-to-End Encrypted with AES-256
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All passwords are encrypted locally in your browser before being stored. Your master password never leaves your device.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'category') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Last Modified</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredPasswords.length === 0 ? (
        <Card className="glass-card border-dashed border-muted">
          <CardContent className="p-8 text-center space-y-3">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No passwords match your filters</p>
              <p className="text-sm text-muted-foreground">
                Adjust your search or add a new entry to get started.
              </p>
            </div>
            <Button className="glow-purple-sm" onClick={() => openEditor()}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first password
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPasswords.map((password) => (
            <Card key={password.id} className="glass-card hover:glow-purple-sm transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{password.name}</CardTitle>
                    <CardDescription className="mt-1">{password.username}</CardDescription>
                  </div>
                  <Badge variant="outline">{password.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Password</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(password.id)}
                      >
                        {visiblePasswords.has(password.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(password.password, 'Password')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="font-mono text-sm p-2 bg-background rounded border border-border">
                    {visiblePasswords.has(password.id) ? password.password : '••••••••••••••'}
                  </div>
                </div>

                {password.url && (
                  <div className="text-xs text-muted-foreground truncate">{password.url}</div>
                )}

                <div className="flex flex-wrap gap-1">
                  {password.tags.length ? (
                    password.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Untagged
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditor(password)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(password.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Modified: {new Date(password.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeEditor())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit password' : 'Add new password'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the fields below and save to overwrite the entry.'
                : 'Fill in the details to add a new credential to your vault.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="GitHub"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin@company.com"
                value={formState.username}
                onChange={(e) => setFormState((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-value">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password-value"
                  type="text"
                  placeholder="StrongPass!2024"
                  value={formState.password}
                  onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={formState.url}
                onChange={(e) => setFormState((prev) => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Cloud Services"
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="work, critical"
                value={formState.tags}
                onChange={(e) => setFormState((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" type="button" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} className="glow-purple-sm">
              {editingId ? 'Save changes' : 'Add password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

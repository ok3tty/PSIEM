import { supabase } from './supabase';
import { encryptData, decryptData } from './encryption';

export interface PasswordEntry {
  id: string;
  user_id: string;
  name: string;
  username: string;
  encrypted_password: string;
  url: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DecryptedPasswordEntry extends Omit<PasswordEntry, 'encrypted_password'> {
  password: string;
}

export interface CreatePasswordInput {
  name: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  tags?: string[];
}

export interface UpdatePasswordInput extends Partial<CreatePasswordInput> {
  id: string;
}

/**
 * Password Manager Service
 * Handles all password CRUD operations with encryption
 */
class PasswordManagerService {
  private masterPassword: string | null = null;

  /**
   * Set the master password for encryption/decryption
   */
  setMasterPassword(password: string) {
    this.masterPassword = password;
  }

  /**
   * Clear the master password from memory
   */
  clearMasterPassword() {
    this.masterPassword = null;
  }

  /**
   * Get the current master password
   */
  getMasterPassword(): string {
    if (!this.masterPassword) {
      throw new Error('Master password not set. Please unlock the vault first.');
    }
    return this.masterPassword;
  }

  /**
   * Fetch all password entries for the current user
   */
  async fetchPasswords(): Promise<DecryptedPasswordEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching passwords:', error);
      throw new Error('Failed to fetch passwords');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Decrypt all passwords
    const masterPwd = this.getMasterPassword();
    const decrypted = await Promise.all(
      data.map(async (entry) => {
        try {
          const password = await decryptData(entry.encrypted_password, masterPwd);
          return {
            ...entry,
            password,
          };
        } catch (error) {
          console.error(`Failed to decrypt password for ${entry.name}:`, error);
          return {
            ...entry,
            password: '[Decryption Failed]',
          };
        }
      })
    );

    return decrypted;
  }

  /**
   * Create a new password entry
   */
  async createPassword(input: CreatePasswordInput): Promise<DecryptedPasswordEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const masterPwd = this.getMasterPassword();
    const encryptedPassword = await encryptData(input.password, masterPwd);

    const { data, error } = await supabase
      .from('passwords')
      .insert({
        user_id: user.id,
        name: input.name,
        username: input.username,
        encrypted_password: encryptedPassword,
        url: input.url || '',
        category: input.category,
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating password:', error);
      throw new Error('Failed to create password entry');
    }

    return {
      ...data,
      password: input.password,
    };
  }

  /**
   * Update an existing password entry
   */
  async updatePassword(input: UpdatePasswordInput): Promise<DecryptedPasswordEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.username !== undefined) updateData.username = input.username;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;

    // Encrypt password if provided
    if (input.password !== undefined) {
      const masterPwd = this.getMasterPassword();
      updateData.encrypted_password = await encryptData(input.password, masterPwd);
    }

    const { data, error } = await supabase
      .from('passwords')
      .update(updateData)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password entry');
    }

    // Decrypt password for return
    const masterPwd = this.getMasterPassword();
    const password = await decryptData(data.encrypted_password, masterPwd);

    return {
      ...data,
      password,
    };
  }

  /**
   * Delete a password entry
   */
  async deletePassword(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting password:', error);
      throw new Error('Failed to delete password entry');
    }
  }

  /**
   * Check if user has set up their vault (has any passwords)
   */
  async hasVaultSetup(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: passwords, error } = await supabase
      .from('passwords')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      console.error('Error checking vault setup:', error);
      return false;
    }

    return passwords !== null && passwords.length > 0;
  }

  /**
   * Verify master password by attempting to decrypt a test value
   */
  async verifyMasterPassword(masterPassword: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if any passwords exist
    const { data: passwords, error: countError } = await supabase
      .from('passwords')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (countError) {
      throw new Error('Failed to check vault status');
    }

    if (!passwords || passwords.length === 0) {
      // No passwords exist yet - this shouldn't happen during unlock
      // First-time users should go through setup flow instead
      throw new Error('No passwords found in vault');
    }

    // Try to decrypt one password to verify the master password
    const { data: testPassword, error: fetchError } = await supabase
      .from('passwords')
      .select('encrypted_password')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (fetchError || !testPassword) {
      throw new Error('Failed to fetch test password');
    }

    try {
      await decryptData(testPassword.encrypted_password, masterPassword);
      return true;
    } catch (error) {
      // Decryption failed - wrong master password
      return false;
    }
  }
}

export const passwordService = new PasswordManagerService();

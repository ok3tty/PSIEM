/**
 * Client-side encryption utilities for password manager
 * Uses AES-GCM encryption with the Web Crypto API
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Derives an encryption key from a user's password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(plaintext: string, masterPassword: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const key = await deriveKey(masterPassword, salt);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedBase64: string, masterPassword: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const encryptedData = combined.slice(16 + IV_LENGTH);

    const key = await deriveKey(masterPassword, salt);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - incorrect password or corrupted data');
  }
}

/**
 * Generates a random secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[array[0] % uppercase.length];
  password += lowercase[array[1] % lowercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validates master password strength
 */
export function validateMasterPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Master password must be at least 12 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Master password must contain uppercase letters' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Master password must contain lowercase letters' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Master password must contain numbers' };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Master password must contain special characters' };
  }
  
  return { valid: true, message: 'Master password is strong' };
}
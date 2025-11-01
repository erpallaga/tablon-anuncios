/**
 * Simple master password authentication service
 * This checks against a master password stored in Supabase (via a simple table or config)
 */

const MASTER_PASSWORD_KEY = 'master_password';

export const authService = {
  /**
   * Verify master password
   * For simplicity, we'll store the master password hash in a config table
   * or use an environment variable. For now, we'll use a simple approach.
   */
  async verifyMasterPassword(password: string): Promise<boolean> {
    // Get master password from environment or Supabase config table
    // For now, we'll use a simple approach with environment variable
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD;

    if (!masterPassword) {
      console.warn('VITE_MASTER_PASSWORD not set. Using default "admin123"');
      return password === 'admin123';
    }

    // Simple comparison (in production, you'd want to hash and compare)
    return password === masterPassword;
  },
};


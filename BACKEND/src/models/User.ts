import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // Hashed
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

/**
 * File-based User Model
 * TODO: Replace with database implementation for production
 */
class UserModel {
  private usersFile: string;

  constructor() {
    this.usersFile = path.join(process.cwd(), 'data', 'users.json');
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Initialize users file if it doesn't exist
      try {
        await fs.access(this.usersFile);
      } catch {
        await fs.writeFile(this.usersFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Failed to ensure data directory:', error);
    }
  }

  private async readUsers(): Promise<User[]> {
    try {
      const content = await fs.readFile(this.usersFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read users file:', error);
      return [];
    }
  }

  private async writeUsers(users: User[]): Promise<void> {
    await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
  }

  async create(email: string, password: string, name: string): Promise<User> {
    const users = await this.readUsers();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      password: hashedPassword,
      role: users.length === 0 ? 'admin' : 'user', // First user is admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(user);
    await this.writeUsers(users);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.readUsers();
    return users.find(u => u.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    const users = await this.readUsers();
    return users.find(u => u.id === id) || null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return null;
    }

    users[index] = {
      ...users[index],
      ...updates,
      id: users[index].id, // Prevent ID change
      password: users[index].password, // Prevent password change via this method
      updatedAt: new Date().toISOString()
    };

    await this.writeUsers(users);
    return users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.readUsers();
    const filteredUsers = users.filter(u => u.id !== id);

    if (filteredUsers.length === users.length) {
      return false; // User not found
    }

    await this.writeUsers(filteredUsers);
    return true;
  }

  async listUsers(): Promise<User[]> {
    return this.readUsers();
  }

  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const users = await this.readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[index].password = hashedPassword;
    users[index].updatedAt = new Date().toISOString();

    await this.writeUsers(users);
    return true;
  }
}

// Export singleton instance
export const userModel = new UserModel();

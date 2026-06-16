import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  register: (username: string, password: string, email: string, phone: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('renthub_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('renthub_token', data.token);
        localStorage.setItem('renthub_user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Login connection failed:', err);
      return null;
    }
  };

  const register = async (username: string, password: string, email: string, phone: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://rent-hub-xnoh.onrender.com/api"}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, phone })
      });
      
      const data = await response.json();
      return !!data.success;
    } catch (err) {
      console.error('Registration connection failed:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('renthub_token');
    localStorage.removeItem('renthub_user');
    setUser(null);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('app_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const user = await apiService.loginUser(email, password);
    setCurrentUser(user);
    localStorage.setItem('app_user', JSON.stringify(user));
    return user;
  };

  const register = async (username, email, password) => {
    const user = await apiService.registerUser(username, email, password);
    setCurrentUser(user);
    localStorage.setItem('app_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

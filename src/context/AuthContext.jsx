import { createContext, useContext, useState, useMemo } from 'react';
import { authService, apiService } from '../services';

const AuthContext = createContext(null);

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
    const user = await authService.loginUser(email, password);
    setCurrentUser(user);
    localStorage.setItem('app_user', JSON.stringify(user));
    return user;
  };

  const register = async (username, email, password) => {
    const user = await authService.registerUser(username, email, password);
    setCurrentUser(user);
    localStorage.setItem('app_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user');
  };

  /**
   * Helper: memanggil method apiService dengan user_id yang diinjeksikan otomatis.
   * Proxy ini di-recreate setiap kali currentUser berubah, sehingga userId
   * selalu fresh (tidak stale).
   *
   * Contoh: await api.getPaketList()  →  apiService.getPaketList(currentUser.user_id)
   *
   * Penggunaan di page:
   *   const { api } = useAuth();
   *   const list = await api.getKunjunganList();
   */
  const api = useMemo(
    () =>
      new Proxy(
        {},
        {
          get(_, method) {
            return (...args) => {
              const userId = currentUser?.user_id;
              return apiService[method](userId, ...args);
            };
          },
        }
      ),
    [currentUser]
  );

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, api }}>
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

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

  // Tracks whether the server-side session check has completed.
  // Prevents rendering protected content before we know the session is valid.
  const [sessionChecked, setSessionChecked] = useState(false);

  // On mount: if there's a stored session, verify the user still exists in the DB.
  // If the account was deleted from the spreadsheet, auto-logout immediately.
  useEffect(() => {
    if (!currentUser?.user_id) {
      setSessionChecked(true);
      return;
    }

    authService.validateSession(currentUser.user_id)
      .then(() => {
        setSessionChecked(true);
      })
      .catch(() => {
        // Account deleted or unreachable — clear stale session
        setCurrentUser(null);
        localStorage.removeItem('app_user');
        setSessionChecked(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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

  // Show a minimal loader while the session check is in flight.
  // This prevents a flash of the dashboard for deleted accounts.
  if (!sessionChecked) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--background, #fff)',
        }}
        aria-label="Memeriksa sesi..."
      >
        <svg
          style={{ width: 40, height: 40, animation: 'spin 1s linear infinite' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

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


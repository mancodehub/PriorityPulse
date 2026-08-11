import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const defaultUser = {
  name: 'Emma Blake',
  email: 'emma@prioritypulse.com',
  organization: 'PriorityPulse Ops',
  avatar: 'EB',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultUser);

  const login = ({ email }) => {
    return new Promise((resolve) => {
      setUser({ ...defaultUser, email });
      resolve({ success: true });
    });
  };

  const register = ({ email, name }) => {
    return new Promise((resolve) => {
      setUser({ ...defaultUser, email, name: name || defaultUser.name });
      resolve({ success: true });
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout, register }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchMe } from '../api/client';

const AuthUserContext = createContext(null);

export function useAuthenticatedUser() {
  return useContext(AuthUserContext);
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('pp_token');

    if (!token) {
      setUser(null);
      setStatus('unauthenticated');
      return undefined;
    }

    setStatus('checking');
    fetchMe()
      .then(({ data }) => {
        if (!active) return;
        setUser(data);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('pp_token');
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const value = useMemo(() => user, [user]);

  if (status === 'checking') return null;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

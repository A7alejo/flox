import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { quitarDelServidor } from '../lib/push';

const AuthContext = createContext(null);

// usuario: undefined = todavía chequeando la sesión · null = sin sesión · objeto = logueado
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(undefined);
  const [bootError, setBootError] = useState(null);

  // Cualquier 401 de la API (sesión vencida) devuelve a la pantalla de login.
  useEffect(() => {
    setUnauthorizedHandler(() => setUsuario(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const checkSession = useCallback(async () => {
    setBootError(null);
    setUsuario(undefined);
    try {
      setUsuario(await authApi.me());
    } catch (err) {
      // Sin red o servidor caído: no es lo mismo que "no hay sesión".
      setBootError(err);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email, password) => {
    setUsuario(await authApi.login(email, password));
  }, []);

  const logout = useCallback(async () => {
    try {
      await quitarDelServidor().catch(() => {}); // antes de salir: todavía hay sesión para pedirlo
      await authApi.logout();
    } finally {
      setUsuario(null);
    }
  }, []);

  const value = useMemo(
    () => ({ usuario, bootError, login, logout, retry: checkSession }),
    [usuario, bootError, login, logout, checkSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

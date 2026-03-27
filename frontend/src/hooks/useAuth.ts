import { useEffect, useState, useCallback } from 'react';
import { getMe } from '../api';
import {
  consumeCognitoCallbackTokens,
  tokenStore,
} from '../auth.js';
import type { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMe = useCallback(async () => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setError('');
    try {
      const data = await getMe();
      setUser(data.user);
    } catch {
      tokenStore.clear();
      setError('로그인 상태 확인에 실패했습니다. 다시 로그인해 주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    consumeCognitoCallbackTokens();
    loadMe();
  }, [loadMe]);

  const handleLoginSuccess = useCallback(async () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setLoading(true);
    setError('');
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    window.location.href = '/';
  }, []);

  return { user, loading, error, handleLoginSuccess, logout, setError };
}

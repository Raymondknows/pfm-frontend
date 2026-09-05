import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionHandler() {
  const router = useRouter();

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('pfm.accessToken');
    localStorage.removeItem('pfm.refreshToken');
    localStorage.removeItem('pfm.user');
    router.push('/login');
  }, [router]);

  const handleUnauthorizedResponse = useCallback((status: number) => {
    if (status === 401) {
      handleSessionExpired();
      return true;
    }
    return false;
  }, [handleSessionExpired]);

  return { handleSessionExpired, handleUnauthorizedResponse };
}

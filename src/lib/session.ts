import { useRouter } from 'next/navigation';

export function useSessionHandler() {
  const router = useRouter();

  const handleSessionExpired = () => {
    localStorage.removeItem('pfm.accessToken');
    localStorage.removeItem('pfm.refreshToken');
    localStorage.removeItem('pfm.user');
    router.push('/login');
  };

  const handleUnauthorizedResponse = (status: number) => {
    if (status === 401) {
      handleSessionExpired();
      return true;
    }
    return false;
  };

  return { handleSessionExpired, handleUnauthorizedResponse };
}

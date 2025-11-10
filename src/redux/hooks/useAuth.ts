import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  return { user, token };
};

interface User {
  id: string;
  name: string;
  loginName: string;
  repType: string;
  territory: string;
  role?: "superadmin" | "rep"
}

export const useUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('better-user');
      if (storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser)
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          setUser(null);
        }
      }
    }
  }, []);

  return user;
};

import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Message = {
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string | Timestamp;
};

export type Lead = {
  id: string;
  customerName: string;
  customerAvatar: string;
  advisorName: string;
  advisorAvatar: string;
  status: 'Potencial' | 'Cualificado' | 'Cerrado' | 'Perdido';
  lastContact: string; // This will be the formatted string for display
  transcript: Message[];
};

export type UserRole = "superadmin" | "admin" | "operador";

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  suspended: boolean;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

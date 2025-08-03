
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Message = {
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string | Timestamp;
};

export type Lead = {
  id: string;
  customerName: string; // Se mantendrá como string, con valor por defecto "Nombre no disponible"
  customerAvatar?: string; // Avatar puede ser opcional
  advisorName: string; // Se mantendrá como string, con valor por defecto
  advisorAvatar?: string; // Avatar puede ser opcional
  status: 'Potencial' | 'Cualificado' | 'Cerrado' | 'Perdido';
  lastContact: string; // Este será el string formateado para mostrar
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

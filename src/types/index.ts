
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Message = {
  role: 'user' | 'model';
  text: string;
};

export type Lead = {
  id:string;
  customerName: string; 
  customerAvatar?: string;
  advisorName: string;
  advisorAvatar?: string;
  status: 'Potencial' | 'Cualificado' | 'Cerrado' | 'Perdido' | 'Iniciado';
  lastContact: string;
  messages: Message[];
};

// Datos capturados del cliente dentro de una conversación
export interface CustomerData {
  firstName?: string;
  lastName?: string;
  fullName?: string; // derivado
  email?: string;
  phone?: string;
  consent?: boolean;
  source?: string; // p.ej. "chat-inline-form"
  collectedAt?: string; // ISO string
}

export interface LeadCaptureMeta {
  requested?: boolean;
  requestedAt?: string; // ISO
  completed?: boolean;
  completedAt?: string; // ISO
  method?: string; // p.ej. "inline-form"
}

// Conversación en Firestore (estructura parcial)
export interface ConversationDoc {
  id?: string;
  messages?: Message[];
  advisorName?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  customerData?: CustomerData;
  leadCapture?: LeadCaptureMeta;
}

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

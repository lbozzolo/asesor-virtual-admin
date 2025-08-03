export type Message = {
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string;
};

export type Lead = {
  id: string;
  customerName: string;
  customerAvatar: string;
  advisorName: string;
  advisorAvatar: string;
  status: 'Potencial' | 'Cualificado' | 'Cerrado' | 'Perdido';
  lastContact: string;
  transcript: Message[];
};

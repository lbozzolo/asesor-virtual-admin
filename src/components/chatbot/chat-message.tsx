
"use client";

import { User } from 'lucide-react';

const teamAvatarUrl = "https://studyxacademia.com/wp-content/uploads/2024/07/cropped-android-chrome-512x512-2.png";

interface ChatMessageProps {
  message: {
    role: 'user' | 'model';
    text: string;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isBot = message.role === 'model';

  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      const boldRegex = /\*\*(.*?)\*\*/g;
      const textParts = part.split(boldRegex);
      return textParts.map((textPart, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{textPart}</strong>;
        }
        const lines = textPart.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, j) => (
          <span key={j} className="block">{line}</span>
        ));
      });
    });
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <img src={teamAvatarUrl} alt="Equipo de Studyx" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />}
      <div className={`px-4 py-3 rounded-2xl max-w-lg break-words leading-relaxed ${isBot ? 'bg-gray-200 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
        {isBot ? renderMessageWithLinks(message.text) : message.text}
      </div>
      {!isBot && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600"><User size={24} /></div>}
    </div>
  );
};

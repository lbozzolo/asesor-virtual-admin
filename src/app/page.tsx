
"use client";

import './chatbot.css';
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { InvoiceModal } from '@/components/chatbot/invoice-modal';
import { ChatMessage } from '@/components/chatbot/chat-message';
import { LeftPanel } from '@/components/chatbot/left-panel';
import { ChatHeader } from '@/components/chatbot/chat-header';
import { TypingIndicator } from '@/components/chatbot/typing-indicator';
import type { Message } from '@/types';
import { chat } from '@/ai/flows/chat-flow';
import { LeadCaptureForm } from '@/components/lead-capture-form';

// --- Componente Principal de la Aplicación de Chat ---
export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorName, setAdvisorName] = useState<string | null>(null);
  const [salesStage, setSalesStage] = useState('sondear');
  const [customerData, setCustomerData] = useState<any>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [leadCaptureRequested, setLeadCaptureRequested] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Solo inicializar en el cliente
    if (advisorName !== null && conversationId !== null) return;
    const advisorNames = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián'];
    const randomName = advisorNames[Math.floor(Math.random() * advisorNames.length)];
    setAdvisorName(randomName);
    const initialMessage: Message = { role: 'model', text: `Hola! Mi nombre es ${randomName}, del equipo de asesoramiento de Studyx. ¿Cómo puedo ayudarte?` };
    setMessages([initialMessage]);
    const newConversationId = `conv-${Date.now()}`;
    setConversationId(newConversationId);
    const initializeConversation = async () => {
      try {
        await setDoc(doc(db, "conversations", newConversationId), {
          messages: [initialMessage],
          advisorName: randomName,
          createdAt: serverTimestamp(),
          status: "Iniciado"
        });
      } catch (error) {
        console.error("Error al inicializar la conversación:", error);
      }
      setInitialized(true);
    };
    initializeConversation();
    inputRef.current?.focus();
  }, []);


  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);


  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const updateConversationInFirestore = async (newMessages: Message[]) => {
    if (!conversationId) {
      console.error("No se puede actualizar la conversación: ID de conversación no definido.");
      return;
    }
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, { 
        messages: newMessages, 
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      console.error("Error al actualizar la conversación en Firestore:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if (!userInput) return;

    const userMessage: Message = { role: 'user', text: userInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);
    
    await updateConversationInFirestore(updatedMessages);
    
    try {
      const responseText = await chat(updatedMessages);
      const botResponse: Message = { role: 'model', text: responseText };
      if (/completa el formulario/i.test(responseText) || /tus datos de contacto/i.test(responseText)) {
        setLeadCaptureRequested(true);
      }
      
      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      await updateConversationInFirestore(finalMessages);
    } catch (error) {
        console.error("Error al obtener respuesta de la IA:", error);
        setErrorMessage("Lo siento, no pude procesar tu solicitud en este momento.");
        const botResponse: Message = { role: 'model', text: "Tuve un problema para conectarme. Intenta de nuevo en un momento." };
        const finalMessages = [...updatedMessages, botResponse];
        setMessages(finalMessages);
        await updateConversationInFirestore(finalMessages);
    } finally {
        setIsLoading(false);
    }
  };

  if (!initialized) {
    // Evita renderizar hasta que la inicialización esté lista (solo en cliente)
    return null;
  }
  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col font-sans text-base">
      {showInvoice && <InvoiceModal customerData={customerData} onClose={() => setShowInvoice(false)} />}
      <ChatHeader />
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="container mx-auto h-full principal px-0 sm:px-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <LeftPanel salesStage={salesStage}/>
              <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-lg h-full overflow-hidden border border-gray-200">
                <header className="bg-gray-50 border-b p-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">Habla con un Asesor</h2>
                </header>
                <main className="flex-1 overflow-y-auto p-4 text-base">
                    {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                    {leadCaptureRequested && !leadCaptured && conversationId && (
                      <div className="mt-4">
                        <LeadCaptureForm
                          conversationId={conversationId}
                          onCompleted={() => { setLeadCaptured(true); }}
                        />
                      </div>
                    )}
                    {isLoading && <TypingIndicator />}
                    <div ref={chatEndRef} />
                </main>
                <footer className="bg-white border-t p-2 flex-shrink-0">
                    <div className="container mx-auto max-w-3xl">
                        {errorMessage && (
                            <div className="bg-red-100 text-red-700 text-sm p-2 text-center mb-2 rounded">
                                {errorMessage}
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu consulta aquí..." className="flex-1 w-full px-4 py-3 border-2 border-transparent rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-base" disabled={isLoading} />
                            <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"><Send size={20} /></button>
                        </form>
                    </div>
                </footer>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

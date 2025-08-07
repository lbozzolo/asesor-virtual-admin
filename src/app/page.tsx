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


// --- Función para obtener los cursos desde Google Sheets ---
const getCursosFromGoogleSheets = async () => {
    // This function needs to be implemented safely in a Next.js environment,
    // likely using a Server Action or an API route to not expose the API key.
    // For now, it will return an empty list.
  return [];
};

// --- Componente Principal de la Aplicación de Chat ---
export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorName, setAdvisorName] = useState('');
  const [salesStage, setSalesStage] = useState('sondear');
  const [customerData, setCustomerData] = useState<any>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [inactivityPromptCount, setInactivityPromptCount] = useState(0);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [cursos, setCursos] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch the system prompt from the public folder
    fetch('/prompts/v1_base.txt')
      .then(res => {
        if (res.ok) return res.text();
        throw new Error('Network response was not ok.');
      })
      .then(text => setSystemPrompt(text))
      .catch(error => console.error("Failed to fetch system prompt:", error));
  }, []);

  useEffect(() => {
    const advisorNames = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián'];
    const randomName = advisorNames[Math.floor(Math.random() * advisorNames.length)];
    setAdvisorName(randomName);
    const initialMessage: Message = { role: 'model', text: `Hola! Mi nombre es ${randomName}, del equipo de asesoramiento de Studyx. Como puedo ayudarte?` };
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
    };
    initializeConversation();

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchCursos = async () => {
        const data = await getCursosFromGoogleSheets();
        setCursos(data.flat()); // Convierte las filas en un array plano
    };
    fetchCursos();
  }, []);

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  
  const sendBotMessage = async (textBlocks: string[]) => {
    for (const block of textBlocks) {
      setIsLoading(true);
      // Simulate typing delay
      const charsPerSecond = 12;
      const timeToType = (block.length / charsPerSecond) * 1000;
      const baseDelay = 500; // Minimum delay
      const totalDelay = baseDelay + timeToType;
      const maxDelay = 4000; // Maximum delay to avoid long waits
      const finalDelay = Math.min(totalDelay, maxDelay);
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
      
      setIsLoading(false);
      setMessages(prev => {
        const newMessages: Message[] = [...prev, { role: 'model', text: block }];
        if (conversationId) {
            updateDoc(doc(db, "conversations", conversationId), { 
                messages: newMessages,
                updatedAt: serverTimestamp()
            });
        }
        return newMessages;
      });
      // Small delay between message blocks
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  };

  useEffect(() => {
    scrollToBottom();
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model' && inactivityPromptCount < 2 && salesStage !== 'finalizado') {
        const timeoutDuration = 120000; // 2 minutos
        inactivityTimerRef.current = setTimeout(() => {
            if (inactivityPromptCount === 0) { 
                sendBotMessage(["Sigues ahí?"]); 
                setInactivityPromptCount(1); 
            } else if (inactivityPromptCount === 1) {
                const finalMessage = "Parece que no es un buen momento. No te preocupes! Si quieres continuar la conversación más tarde, puedes escribirme a nuestro WhatsApp 786-916-4372. Que tengas un buen día!";
                sendBotMessage(finalMessage.split('[---]'));
                setInactivityPromptCount(2); 
            }
        }, timeoutDuration);
    }
    return () => {
      if(inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    };
  }, [messages, isLoading, inactivityPromptCount, salesStage, conversationId]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const callChatApi = async (currentMessages: Message[], userInput: string) => {
    setErrorMessage(null);
    if (!systemPrompt) {
        setErrorMessage("El prompt del sistema aún no se ha cargado. Por favor, espera un momento.");
        return '';
    }
    try {
        const isCourseQuery = cursos.some(course => 
          userInput.toLowerCase().includes(course.toLowerCase())
        );
        const coursesList = cursos.length > 0 
            ? `Aquí tienes la lista actualizada de cursos disponibles en Studyx: ${cursos.join(', ')}.` 
            : 'Actualmente no hay cursos disponibles.';
        
        const fullPrompt = `${isCourseQuery ? coursesList : ''}\n\n${userInput}`.trim();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: currentMessages,
          prompt: fullPrompt,
          systemPrompt, // Pass the loaded system prompt to the API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || `La llamada a la API falló con el estado: ${response.status}`);
      }
      
      return data.text;

    } catch (error: any) {
      console.error("Error calling chat API:", error);
      setErrorMessage(error.message || "Error de conexión - Espere y vuelva a intentar");
      return '';
    }
  };

  const updateConversationInFirestore = async (data: any) => {
    if (!conversationId) {
      console.error("No se puede actualizar la conversación: ID de conversación no definido.");
      return;
    }
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, data);
    } catch (error) {
      console.error("Error al actualizar la conversación en Firestore:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const userInput = input;
    if (!userInput.trim()) return;

    const userMessage: Message = { role: 'user', text: userInput };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    updateConversationInFirestore({ messages: newMessages, updatedAt: serverTimestamp() });
    
    setInput('');
    if(inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    setInactivityPromptCount(0);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(true);

    if (salesStage === 'esperando_pago' && (userInput.toLowerCase().includes('ya pagué') || userInput.toLowerCase().includes('listo'))) {
        setShowInvoice(true);
        setSalesStage('finalizado');
        updateConversationInFirestore({ status: "Vendido", completedAt: serverTimestamp() });
        const finalMessage = `Excelente! Bienvenido a Studyx...`;
        await sendBotMessage(finalMessage.split('[---]'));
        return;
    }

    if (salesStage.startsWith('recopilar_')) {
        const field = salesStage.split('_')[1];
        const isQuestionOrDeviation = userInput.toLowerCase().includes('?') || userInput.toLowerCase().split(' ').length > 8 || ['qué', 'cómo', 'cuánto', 'por', 'dónde', 'cuál', 'pero', 'no quiero'].some(kw => userInput.toLowerCase().includes(kw));
        
        if (!isQuestionOrDeviation) {
            let validationError = null;
            if (field === 'email' && !/\S+@\S+\.\S+/.test(userInput)) validationError = "Hmm, ese email no parece correcto...";
            if (field === 'phone' && !/^\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/.test(userInput)) validationError = "Ese número de teléfono no parece válido...";
            if (validationError) { setIsLoading(false); await sendBotMessage([validationError]); return; }

            const newData = { ...customerData, [field]: userInput };
            setCustomerData(newData);
            updateConversationInFirestore({ customerData: newData, status: "Lead Capturado" });

            const fields = ['nombre', 'email', 'phone', 'estado'];
            const currentIndex = fields.indexOf(field);
            if (currentIndex < fields.length - 1) {
                const nextField = fields[currentIndex + 1];
                setSalesStage(`recopilar_${nextField}`);
                let question = `Perfecto. Ahora necesito tu ${nextField}, por favor.`;
                if (nextField === 'estado') question = "Entendido. Y en qué estado de los Estados Unidos vives?";
                await sendBotMessage([question]);
            } else {
                setSalesStage('verificar_datos');
                const finalData = { ...newData, estado: userInput };
                setCustomerData(finalData);
                const verificationMessage = `Genial, gracias. Confirma que estos datos son correctos: [---] Nombre: ${finalData.nombre} [---] Email: ${finalData.email} [---] Teléfono: ${finalData.phone} [---] Estado: ${finalData.estado}. [---] Es todo correcto?`;
                await sendBotMessage(verificationMessage.split('[---]'));
            }
            return;
        }
    }

    if (salesStage === 'verificar_datos') {
        if (userInput.toLowerCase().includes('no')) {
            setSalesStage('recopilar_nombre'); setCustomerData({});
            await sendBotMessage(["No hay problema, empecemos de nuevo. Cuál es tu nombre completo?"]);
        } else {
            setSalesStage('esperando_pago'); const finalData = { ...customerData, nombre: customerData.nombre || 'Estudiante' };
            const accessMessage = `Excelente, ${finalData.nombre}! Tu acceso ha sido creado...`;
            await sendBotMessage(accessMessage.split('[---]'));
        }
        return;
    }

    const botResponseText = await callChatApi(messages, userInput);
    
    if (botResponseText) {
        const trimmedResponse = botResponseText.replace(/^[\s\n]+/, '');

        if (trimmedResponse.includes('[INICIAR_REGISTRO]')) {
            setSalesStage('recopilar_nombre');
            const cleanResponse = trimmedResponse.replace('[INICIAR_REGISTRO]', '').trim();
            await sendBotMessage(cleanResponse.split('[---]'));
        } else {
            await sendBotMessage(trimmedResponse.split('[---]'));
        }
    } else {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col font-sans text-base">
      {showInvoice && <InvoiceModal customerData={customerData} onClose={() => setShowInvoice(false)} />}
      
      <ChatHeader />

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="container mx-auto h-full principal px-0 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <LeftPanel salesStage={salesStage}/>

              <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-lg h-full overflow-hidden border border-gray-200">
                <header className="bg-gray-50 border-b p-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">Habla con un Asesor</h2>
                </header>
                <main className="flex-1 overflow-y-auto p-4 text-base">
                    {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
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
                            <button type="submit" disabled={isLoading || !input.trim() || !systemPrompt} className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"><Send size={20} /></button>
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

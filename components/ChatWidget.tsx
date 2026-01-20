import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Phone } from 'lucide-react';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Chat } from '@google/genai';

const ChatWidget: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Good day. I am the Studio Austinn digital concierge. How may I assist with your art collection?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const whatsappNumber = "+971581558866"; // Extracted from Contact info
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Studio Austinn, I'm interested in your art services.")}`;

  useEffect(() => {
    if (isChatOpen && !chatSession) {
        try {
            const session = createChatSession();
            setChatSession(session);
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    }
  }, [isChatOpen, chatSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(chatSession, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, I am experiencing a momentary disruption. Please try again.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMain = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
    } else {
      setShowMenu(!showMenu);
    }
  };

  const openAiChat = () => {
    setIsChatOpen(true);
    setShowMenu(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      
      {/* Contact Options Menu */}
      {showMenu && !isChatOpen && (
        <div className="mb-4 flex flex-col gap-3 animate-fade-in-up">
          {/* WhatsApp Option */}
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white border border-stone-200 px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-x-2 transition-all duration-300 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-stone-900 transition-colors">Direct WhatsApp</span>
            <div className="w-10 h-10 flex items-center justify-center bg-[#25D366] text-white rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
          </a>

          {/* AI Concierge Option */}
          <button 
            onClick={openAiChat}
            className="
              flex items-center justify-center
              gap-4
              bg-white border border-stone-200
              px-6 py-3
              rounded-full
              shadow-lg
              hover:shadow-xl
              hover:-translate-x-2
              transition-all duration-300
              group
            "
          >
            <span className="
              text-[10px]
              font-bold uppercase tracking-widest
              text-stone-500
              group-hover:text-stone-900
              transition-colors
            ">
              AI Concierge
            </span>

            <div className="
              w-10 h-10
              flex items-center justify-center
              bg-stone-900 text-white
              rounded-full
            ">
              <Sparkles size={18} />
            </div>
          </button>

        </div>
      )}

      {/* Chat Window - Frosted Glass */}
      {isChatOpen && (
        <div className="mb-6 w-80 md:w-96 bg-white/70 backdrop-blur-2xl shadow-2xl rounded-sm overflow-hidden border border-white/50 animate-fade-in-up transition-all duration-300">
          <div className="bg-stone-900/90 p-5 flex justify-between items-center text-white backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-full">
                   <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[10px] uppercase tracking-widest">Studio Austinn AI</h3>
                </div>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-[#25D366] transition-colors p-1"
                title="Talk via WhatsApp"
              >
                <Phone size={16} />
              </a>
              <button onClick={() => setIsChatOpen(false)} className="hover:text-stone-300 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="h-80 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-stone-900 text-white rounded-lg rounded-br-none' 
                      : 'bg-white/50 border border-white text-stone-900 rounded-lg rounded-bl-none shadow-sm'
                  } ${msg.isError ? 'border-red-300 text-red-800 bg-red-50/50' : ''}`}
                >
                  <p className="font-serif italic">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white/50 border border-white px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
                    <div className="flex gap-1.5">
                        <span className="w-1 h-1 bg-stone-900 rounded-full animate-pulse"></span>
                        <span className="w-1 h-1 bg-stone-900 rounded-full animate-pulse delay-100"></span>
                        <span className="w-1 h-1 bg-stone-900 rounded-full animate-pulse delay-200"></span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-stone-200/50 bg-white/40">
            <div className="flex items-center gap-2">
                <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Inquire..."
                className="flex-1 bg-transparent text-sm text-stone-900 focus:outline-none placeholder-stone-500 font-serif italic"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="text-stone-900 hover:scale-110 transition-transform disabled:opacity-30"
                >
                    <Send size={16} />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button - Minimalist */}
      <button 
        onClick={toggleMain}
        className={`group w-14 h-14 flex items-center justify-center shadow-xl transition-all duration-500 rounded-full border z-50 hover:scale-110 ${
          isChatOpen || showMenu ? 'bg-white text-stone-900 border-stone-200' : 'bg-stone-900 text-white border-stone-800'
        }`}
      >
        {isChatOpen || showMenu ? <X size={20} /> : <MessageSquare size={20} strokeWidth={1.5} />}
      </button>
    </div>
  );
};

export default ChatWidget;
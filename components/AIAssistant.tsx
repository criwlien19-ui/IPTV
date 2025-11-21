import React, { useState, useRef, useEffect } from 'react';
import { Subscriber, Offer } from '../types';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';

interface AIAssistantProps {
  subscribers: Subscriber[];
  offers: Offer[];
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ subscribers, offers }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
        id: '1',
        role: 'ai',
        content: 'Bonjour ! Je suis l\'assistant intelligent ALL IPTV. Je peux analyser vos revenus, identifier les abonnés à risque ou vous aider à rédiger des offres. Que puis-je faire pour vous ?',
        timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateAIResponse(userMsg.content, subscribers, offers);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
       <div className="mb-4 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-brand-400 to-purple-600 rounded-lg shadow-lg shadow-brand-500/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">Assistant Intelligent</h2>
       </div>

       <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-xl">
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-600' : 'bg-purple-600'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-slate-700 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i !== msg.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez une question sur vos abonnés ou demandez une analyse..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 pl-4 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-2 text-xs text-center text-slate-500">
                L'IA a accès aux données de vos abonnés pour fournir des réponses contextuelles.
            </div>
          </div>
       </div>
    </div>
  );
};

export default AIAssistant;
"use client";

import { useState } from "react";
import { Send, Sparkles, User, Loader2 } from "lucide-react";

export default function CandidateChatUI({ job }: { job: any }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Standard React State for messages
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi there! 👋 I'm Nova, the AI recruiter for ${job.profiles?.company_name || 'this team'}. We are looking for a **${job.title}** based in ${job.location}.\n\nBefore we begin the actual interview, could you tell me your first and last name?`
    }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // 1. Add user message to UI immediately
    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true); // Trigger the WhatsApp-style spinner

    try {
      // 2. Send standard fetch request to our API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          jobContext: job 
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();

      // 3. Add AI response to UI
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting right now. Could you repeat that?" }]);
    } finally {
      setIsLoading(false); // Stop the spinner
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white border-x border-slate-100 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <header className="h-20 shrink-0 px-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Nova</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Recruiter</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{job.title}</p>
          <p className="text-xs font-medium text-slate-500">{job.location}</p>
        </div>
      </header>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Avatar */}
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] px-5 py-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm' 
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {/* Real-time Typing Indicator (The Spinner) */}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in">
             <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div className="px-5 py-4 rounded-3xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-2">
               <Loader2 size={16} className="animate-spin text-slate-400" />
               <span className="text-sm text-slate-500 font-medium">Nova is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-6">
        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto flex items-center">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Nova is thinking..." : "Type your message..."}
            className="w-full bg-white border border-slate-300 rounded-full pl-6 pr-16 py-4 text-[15px] shadow-lg shadow-slate-200/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-300"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
        <p className="text-center text-[11px] font-medium text-slate-400 mt-4">
          Powered by HireFlow AI. Messages are analyzed by artificial intelligence.
        </p>
      </div>

    </div>
  );
}
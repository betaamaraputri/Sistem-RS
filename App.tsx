import React, { useState, useRef, useEffect } from 'react';
import { AgentRole, Message } from './types';
import { AGENTS } from './constants';
import { routeRequest, generateAgentResponse } from './services/geminiService';
import AgentVisualizer from './components/AgentVisualizer';
import { marked } from 'marked'; // We will use a simple renderer function instead of library to avoid complex deps if possible, but standard text is fine.

// Simple markdown formatter since we cannot install 'marked' easily without package.json in this context
// We will simply render text with line breaks.
const FormattedText = ({ text }: { text: string }) => {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-sans">
      {text}
    </div>
  );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Selamat datang di Sistem Operasi Rumah Sakit INDUK. Silakan sampaikan kebutuhan Anda (Pendaftaran, Janji Temu, Rekam Medis, atau Penagihan).',
      timestamp: new Date(),
      agent: AgentRole.ORCHESTRATOR
    }
  ]);
  const [input, setInput] = useState('');
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [routingReason, setRoutingReason] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isRouting || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Step 1: Routing
    setIsRouting(true);
    setRoutingReason("");
    setActiveAgent(null); // Reset active agent during routing

    try {
      // Simulate "Thinking" time for dramatic effect suitable for the professor's demo
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      const routeResult = await routeRequest(userMsg.content);
      
      setActiveAgent(routeResult.targetAgent);
      setRoutingReason(routeResult.reasoning);
      setIsRouting(false);

      // Step 2: Generation
      setIsGenerating(true);

      // Prepare history for context
      // Filter out system messages and map to API format
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const agentResponseText = await generateAgentResponse(
        routeResult.targetAgent,
        history,
        userMsg.content
      );

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: agentResponseText,
        agent: routeResult.targetAgent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMsg]);

    } catch (error) {
      console.error("Interaction failed", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "Maaf, terjadi kesalahan pada sistem agen. Silakan coba lagi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsRouting(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 md:p-8 gap-6 max-w-7xl mx-auto">
      
      {/* Left Column: Chat Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
              🏥
            </div>
            <div>
              <h1 className="font-bold text-lg">RS Induk Assistant</h1>
              <p className="text-slate-400 text-xs">AI-Powered Hospital Operations</p>
            </div>
          </div>
          {activeAgent && !isRouting && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${AGENTS[activeAgent].color} text-white`}>
              <span>{AGENTS[activeAgent].icon}</span>
              <span>{AGENTS[activeAgent].name}</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system';
            const agent = msg.agent ? AGENTS[msg.agent] : null;

            if (isSystem) {
               return (
                 <div key={msg.id} className="flex justify-center my-4">
                   <div className="bg-gray-200 text-gray-600 text-xs px-4 py-1.5 rounded-full">
                     {msg.content}
                   </div>
                 </div>
               )
            }

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && agent && (
                   <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm mr-2 text-white shadow-sm mt-1 ${agent.color}`}>
                     {agent.icon}
                   </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                  isUser 
                    ? 'bg-slate-700 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {!isUser && agent && (
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                      {agent.name}
                    </div>
                  )}
                  <FormattedText text={msg.content} />
                  <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-slate-400' : 'text-gray-300'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Routing Reason Toast */}
          {routingReason && isGenerating && (
             <div className="flex justify-center animate-pulse">
                <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                   🔄 Routing Logic: {routingReason}
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Jelaskan kebutuhan Anda (e.g., 'Saya ingin membuat janji temu' atau 'Cek tagihan saya')"
              className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all"
              disabled={isRouting || isGenerating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isRouting || isGenerating}
              className={`absolute right-2 top-2 bottom-2 aspect-square rounded-lg flex items-center justify-center transition-all ${
                !input.trim() || isRouting || isGenerating
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 shadow-md'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">RS INDUK AI System v1.0 • Designed for Accounting Information Systems Analysis</p>
          </div>
        </div>
      </div>

      {/* Right Column: Visualization & Status */}
      <div className="hidden md:block w-80 lg:w-96 flex-shrink-0">
        <AgentVisualizer 
          activeAgent={activeAgent} 
          isRouting={isRouting} 
          isGenerating={isGenerating} 
        />
      </div>

    </div>
  );
};

export default App;
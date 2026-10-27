import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  User,
  Bot,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export const AdminChatBot: React.FC = () => {
  const { chatMessages, sendChatMessage, userSession } = usePos();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const isAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage(inputText.trim(), isAdmin);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendChatMessage(prompt, false);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-40 px-3.5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-slate-700 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 group"
          title="Chat with Store Admin & AI Support"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="text-xs font-bold hidden sm:inline">
            {isAdmin ? 'Admin Helpdesk' : 'Chat with Admin'}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-16 md:bottom-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-4 ${
            isMinimized ? 'h-14' : 'h-[500px]'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs">
                {isAdmin ? <ShieldCheck className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>{isAdmin ? 'Admin Support Console' : 'Chat with Admin (Muhammad Bashir)'}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {isAdmin ? 'Replying as Master Admin' : 'Direct line to bashirsonselectric@gmail.com'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50 dark:bg-slate-950/50">
                {chatMessages.map((msg) => {
                  const isMe =
                    (isAdmin && msg.senderRole === 'admin') ||
                    (!isAdmin && msg.senderRole === 'user' && msg.senderId === userSession.email);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[9px] text-slate-400 font-semibold mb-0.5 px-1 flex items-center gap-1">
                        {msg.senderRole === 'admin' ? (
                          <span className="text-amber-500 font-bold">Admin: {msg.senderName}</span>
                        ) : msg.senderRole === 'ai' ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI Support
                          </span>
                        ) : (
                          <span>{msg.senderName}</span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-xs'
                            : msg.senderRole === 'admin'
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-bl-xs font-medium'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Prompt Suggestions for non-admin */}
              {!isAdmin && (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex space-x-1.5 overflow-x-auto scrollbar-none">
                  {[
                    'Increase Udhar Limit',
                    'How to adjust prices?',
                    'WhatsApp invoice support',
                    'Upgrade to Pro Plan',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickPrompt(chip)}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isAdmin ? 'Reply to merchant / cashier...' : 'Ask Admin or AI support...'}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-40 text-white shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};


import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types.ts';
import { streamChatResponse } from '../services/geminiService.ts';
import MessageBubble from './chat/MessageBubble.tsx';
import TypingIndicator from './chat/TypingIndicator.tsx';

// SpeechRecognition API type is now in globals.d.ts
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const Chatbot: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! I'm Nexus, your AI learning assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages, isLoading]);
    
    const handleSend = useCallback(async (textOverride?: string) => {
        const messageToSend = (textOverride || input).trim();
        if (!messageToSend || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await streamChatResponse(messageToSend);
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    if(newMessages.length > 0) {
                       newMessages[newMessages.length - 1].content = modelResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I'm having trouble connecting right now." };
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].content === '') {
                   newMessages[newMessages.length - 1] = errorMessage;
                   return newMessages;
                }
                return [...prev, errorMessage];
             });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages]);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const handleResult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            setInput(finalTranscript + interimTranscript);
            if (finalTranscript) {
                handleSend(finalTranscript);
            }
        };

        const handleEnd = () => setIsListening(false);
        const handleError = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('end', handleEnd);
        recognition.addEventListener('error', handleError);

        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('end', handleEnd);
            recognition.removeEventListener('error', handleError);
            recognition.stop();
        };
    }, [handleSend]);

    const toggleListening = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            setInput('');
            recognition.start();
            setIsListening(true);
        }
    };

    return (
        <div className={`fixed bottom-24 right-6 w-full max-w-md h-[70vh] max-h-[600px] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'}`}>
            <div className="flex flex-col h-full bg-[var(--surface-dark)] text-white rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-black/20 border-b border-[var(--border-color)]">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2"><i className="fas fa-robot text-[var(--primary-color)]"></i> AI Learning Assistant</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors">&times;</button>
                </header>
                <div ref={chatHistoryRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                    {isLoading && !messages[messages.length-1].content && <TypingIndicator />}
                </div>
                <footer className="p-4 bg-black/20 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isListening ? 'Listening...' : "Ask a question..."}
                            rows={1}
                            className="flex-1 p-2 bg-black/20 rounded-lg resize-none focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        />
                        {SpeechRecognition && (
                             <button onClick={toggleListening} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                                <i className="fas fa-microphone-alt"></i>
                            </button>
                        )}
                        <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const ChatbotFab: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="chatbot-fab fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 z-50">
                <i className={`fas text-2xl transition-transform duration-300 ${isOpen ? 'fa-times' : 'fa-robot'}`}></i>
            </button>
            <Chatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default ChatbotFab;
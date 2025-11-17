
import React from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatbotFab from './components/Chatbot';
import PageRenderer from './components/PageRenderer';
import VoiceControl from './components/VoiceControl';
import { ToastContainer } from './components/Toast';
import MarkdownRenderer from './components/MarkdownRenderer';


const App: React.FC = () => {
    return (
        <AppProvider>
            <div className="flex flex-col min-h-screen bg-transparent">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="animate-fade-in">
                        <PageRenderer />
                    </div>
                </main>
                <Footer />
                <ChatbotFab />
                <VoiceControl />
                <ToastContainer />
            </div>
        </AppProvider>
    );
};

export default App;
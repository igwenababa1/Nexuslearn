
import React, { useContext, useMemo } from 'react';
import useVoiceCommands from '../hooks/useVoiceCommands';
import { AppContext, Page, Difficulty } from '../context/AppContext';

const VoiceControl: React.FC = () => {
    const {
        navigateTo,
        setFormDataQuiz,
        handleGenerateQuiz,
        addToast,
    } = useContext(AppContext);

    const commands = useMemo(() => [
        {
            command: ['navigate to * page', 'go to * page', 'show me the * page'],
            callback: (page: string) => {
                const pageLower = page.toLowerCase().trim();
                if (['home', 'guides', 'tutor', 'about', 'contact'].includes(pageLower)) {
                    addToast(`Navigating to ${pageLower} page...`);
                    navigateTo(pageLower as Page);
                } else {
                    addToast(`Sorry, I can't find the "${pageLower}" page.`, 'error');
                }
            }
        },
        {
            command: 'generate quiz about *',
            callback: (topic: string) => {
                addToast(`Setting topic to "${topic}" and generating quiz...`);
                setFormDataQuiz(prev => ({...prev, topic}));
                handleGenerateQuiz();
            }
        },
        {
            command: ['generate quiz', 'create quiz', 'start quiz'],
            callback: () => {
                addToast('Generating quiz now...');
                handleGenerateQuiz();
            }
        },
        {
            command: 'set topic to *',
            callback: (topic: string) => {
                addToast(`Setting topic to: ${topic}`);
                setFormDataQuiz(prev => ({...prev, topic}));
            }
        },
        {
            command: 'set difficulty to *',
            callback: (difficulty: string) => {
                const diffLower = difficulty.toLowerCase().trim();
                 if (['easy', 'medium', 'hard'].includes(diffLower)) {
                    addToast(`Setting difficulty to ${diffLower}.`);
                    setFormDataQuiz(prev => ({...prev, difficulty: diffLower as Difficulty }));
                } else {
                    addToast(`Invalid difficulty: "${difficulty}". Please say easy, medium, or hard.`, 'error');
                }
            }
        },
        {
            command: 'set source text to *',
            callback: (text: string) => {
                addToast(`Setting source text.`);
                setFormDataQuiz(prev => ({...prev, sourceText: text}));
            }
        },
        {
            command: 'clear source text',
            callback: () => {
                addToast(`Clearing source text.`);
                setFormDataQuiz(prev => ({...prev, sourceText: ''}));
            }
        },
        {
            command: 'set explanation guidelines to *',
            callback: (text: string) => {
                addToast(`Setting explanation guidelines.`);
                setFormDataQuiz(prev => ({...prev, explanationGuidelines: text}));
            }
        },
        {
            command: 'clear explanation guidelines',
            callback: () => {
                addToast(`Clearing explanation guidelines.`);
                setFormDataQuiz(prev => ({...prev, explanationGuidelines: ''}));
            }
        }
    ], [navigateTo, setFormDataQuiz, handleGenerateQuiz, addToast]);

    const { isListening, startListening, stopListening } = useVoiceCommands(commands);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
            addToast('Voice control deactivated.', 'info');
        } else {
            startListening();
            addToast('Voice control activated!', 'success');
        }
    };
    
    return (
        <button
            onClick={toggleListening}
            className={`fixed bottom-6 left-6 w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg transform transition-all hover:scale-110 z-50 ${
                isListening 
                ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse' 
                : 'bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)]'}`}
            aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
        >
            <i className="fas fa-microphone-alt text-2xl"></i>
        </button>
    );
};

export default VoiceControl;
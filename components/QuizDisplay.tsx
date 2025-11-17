
import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import type { QuizData, Question, QuizFormData } from '../types';
import { generateVisualExplanation } from '../services/geminiService';
import html2pdf from 'html2pdf.js';
import { AppContext } from '../context/AppContext';
import VideoSummaryModal from './VideoSummaryModal';

interface QuizDisplayProps {
    quizData: QuizData;
    formData: QuizFormData;
}

const VisualExplanationModal: React.FC<{ question: Question; onClose: () => void }> = ({ question, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const generateImage = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await generateVisualExplanation(question);
                if (isMounted) {
                    setImageUrl(result);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Failed to generate image.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        generateImage();

        return () => {
            isMounted = false;
        };
    }, [question]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[var(--surface-color)] w-full max-w-2xl rounded-xl shadow-2xl border border-[var(--border-color)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h3 className="font-display text-lg font-bold">Visual Explanation</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors">&times;</button>
                </header>
                <div className="p-6 flex-1 overflow-y-auto">
                    <p className="font-semibold text-md mb-4 text-[var(--text-muted-color)]">{question.question}</p>
                    <div className="w-full aspect-video bg-black/20 rounded-lg flex items-center justify-center border border-[var(--border-color)]">
                        {isLoading && (
                             <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-[var(--primary-color)] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-sm text-[var(--text-muted-color)]">Sketching the answer...</p>
                            </div>
                        )}
                        {error && <p className="text-red-400">{error}</p>}
                        {imageUrl && <img src={imageUrl} alt="Visual explanation of the answer" className="w-full h-full object-contain rounded-lg" />}
                    </div>
                </div>
            </div>
        </div>
    );
};


const QuestionCard: React.FC<{ question: Question; index: number; showAnswer: boolean }> = ({ question, index, showAnswer }) => {
    // Memoize shuffled responses for matching questions to keep order stable on re-renders
    const shuffledResponses = useMemo(() => {
        if (question.type === 'matching' && question.responses) {
            return [...question.responses].sort(() => Math.random() - 0.5);
        }
        return [];
    }, [question.type, question.responses]);

    return (
        <div className="bg-[var(--bg-color)] p-6 rounded-lg border border-[var(--border-color)] mb-4 transition-all duration-300">
            <p className="font-semibold text-lg mb-4">
                {index + 1}. {question.question}
            </p>
            {question.type === 'multiple-choice' && question.options && (
                <ul className="space-y-2 list-disc list-inside ml-4">
                    {question.options.map((opt, i) => <li key={i}>{opt}</li>)}
                </ul>
            )}
            {question.type === 'true-false' && (
                <div className="flex space-x-4"><span>True</span><span>False</span></div>
            )}
            {question.type === 'fill-blank' && (
                 <div className="w-full h-8 border-b-2 border-dashed border-[var(--border-color)] mt-4"></div>
            )}
            {question.type === 'matching' && question.stems && question.responses && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <ul className="space-y-2 p-2 rounded-md bg-black/10">
                        {question.stems.map((stem, i) => (
                            <li key={i} className="flex items-center">
                                <span className="font-bold mr-2">{i + 1}.</span>
                                <span>{stem}</span>
                            </li>
                        ))}
                    </ul>
                    <ul className="space-y-2 p-2 rounded-md bg-black/10">
                        {shuffledResponses.map((res, i) => (
                             <li key={i} className="flex items-center">
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                <span>{res}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {question.type === 'ordering' && question.items && (
                <ul className="mt-4 space-y-2 list-disc list-inside ml-4 p-2 rounded-md bg-black/10">
                    {question.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            )}
            {showAnswer && (
                <div className="mt-4 p-3 bg-green-500/10 border-l-4 border-green-500 rounded-r-md">
                    <p className="text-green-300 font-bold">Answer: {question.answer}</p>
                </div>
            )}
        </div>
    );
};

const AnswerCard: React.FC<{ question: Question; index: number; onVisualize: (question: Question) => void }> = ({ question, index, onVisualize }) => {
    return (
        <div className="p-4 bg-blue-500/10 rounded-lg flex flex-col h-full">
            <div className="flex-grow">
                <p className="font-bold text-blue-300">{index + 1}. {question.answer}</p>
                <p className="text-sm mt-1 text-[var(--text-muted-color)]">{question.explanation}</p>
            </div>
             <button
                onClick={() => onVisualize(question)}
                className="mt-3 self-start flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            >
                <i className="fas fa-pencil-ruler"></i>
                Visualize Answer
            </button>
        </div>
    );
};


const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizData, formData }) => {
    const { resetQuiz, addBookmark } = useContext(AppContext);
    const [showAnswers, setShowAnswers] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [visualizingQuestion, setVisualizingQuestion] = useState<Question | null>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const quizPaperRef = useRef<HTMLDivElement>(null);

    const printQuiz = () => {
        const originalShowAnswers = showAnswers;
        setShowAnswers(true);
        setTimeout(() => {
            window.print();
            setShowAnswers(originalShowAnswers);
        }, 100);
    };

    const handleDownloadPDF = async () => {
        if (!quizPaperRef.current) return;
        
        setIsDownloading(true);
        const originalShowAnswers = showAnswers;
        setShowAnswers(true);

        // Allow time for DOM to update with answers shown
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = quizPaperRef.current;
        const opt = {
            margin: 0.5,
            filename: `${quizData.title.replace(/\s+/g, '_')}_Quiz.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();

        setShowAnswers(originalShowAnswers);
        setIsDownloading(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="quiz-actions-header sticky top-24 z-40 flex justify-between items-center mb-6 p-3 bg-[var(--surface-color)]/80 backdrop-blur-md rounded-lg border border-[var(--border-color)]">
                <button onClick={resetQuiz} className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-500/20 hover:bg-gray-500/40 transition-colors">
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <div className="flex items-center gap-4 flex-wrap justify-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={showAnswers} onChange={() => setShowAnswers(!showAnswers)} className="sr-only peer" />
                         <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                        <span>Show Answers</span>
                    </label>
                    <button 
                        onClick={() => addBookmark(quizData.title, formData)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors"
                    >
                        <i className="fas fa-bookmark"></i>
                        <span>Bookmark</span>
                    </button>
                    <button 
                        onClick={handleDownloadPDF} 
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-500/20 hover:bg-purple-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-file-pdf"></i>
                                <span>Download PDF</span>
                            </>
                        )}
                    </button>
                     <button onClick={() => setShowVideoModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-teal-500/20 hover:bg-teal-500/40 transition-colors">
                        <i className="fas fa-video"></i> Generate Video
                    </button>
                    <button onClick={printQuiz} className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500/20 hover:bg-blue-500/40 transition-colors">
                        <i className="fas fa-print"></i> Print
                    </button>
                </div>
            </div>

            <div ref={quizPaperRef} className="quiz-paper p-8 md:p-12 bg-[var(--surface-color)] rounded-xl shadow-2xl shadow-black/30 border border-[var(--border-color)]">
                <header className="text-center border-b-2 border-[var(--border-color)] pb-6 mb-8">
                    <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]">{quizData.title}</h1>
                    <div className="flex justify-center gap-6 mt-4 text-sm text-[var(--text-muted-color)]">
                        <span><strong>Topic:</strong> {quizData.topic}</span>
                        <span><strong>Difficulty:</strong> {quizData.difficulty}</span>
                        <span><strong>Questions:</strong> {quizData.numQuestions}</span>
                    </div>
                </header>
                
                <section className="mb-12">
                    <h2 className="text-2xl font-bold font-display mb-6">Questions</h2>
                    {quizData.questions.map((q, index) => (
                        <QuestionCard key={q.id} question={q} index={index} showAnswer={showAnswers} />
                    ))}
                </section>
                
                {showAnswers && (
                    <section className="answer-key-section transition-opacity duration-500">
                        <h2 className="text-2xl font-bold font-display mb-6 border-t-2 border-[var(--border-color)] pt-8">Answer Key</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quizData.questions.map((q, index) => (
                            <AnswerCard key={q.id} question={q} index={index} onVisualize={setVisualizingQuestion} />
                        ))}
                        </div>
                    </section>
                )}
            </div>
            {visualizingQuestion && <VisualExplanationModal question={visualizingQuestion} onClose={() => setVisualizingQuestion(null)} />}
            {showVideoModal && <VideoSummaryModal topic={quizData.topic} onClose={() => setShowVideoModal(false)} />}
        </div>
    );
};

export default QuizDisplay;

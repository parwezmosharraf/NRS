import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Brain, 
  ChevronRight, 
  LogOut, 
  User, 
  Trophy, 
  Layout, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Loader2,
  ArrowLeft,
  Flame,
  Stethoscope
} from 'lucide-react';
import { MBBS_SUBJECTS } from './constants';
import { generateMCQs, generateFlashcards, type MCQ, type Flashcard } from './services/gemini';
import { cn } from './lib/utils';

// --- Types ---
interface UserData {
  id: number;
  email: string;
  name: string;
}

interface ScoreRecord {
  id: number;
  subject: string;
  chapter: string;
  score: number;
  total: number;
  timestamp: string;
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none', variants[variant], className)} 
      {...props} 
    />
  );
};

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) => (
  <div 
    className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm p-6', className)}
    {...props}
  >
    {children}
  </div>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn('w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all', className)} 
    {...props} 
  />
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('medico_token'));
  const [view, setView] = useState<'auth' | 'dashboard' | 'subject' | 'practice' | 'flashcards' | 'report'>('auth');
  const [selectedSubject, setSelectedSubject] = useState<typeof MBBS_SUBJECTS[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | string>(5);
  const [flashcardCount, setFlashcardCount] = useState<number | string>(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<ScoreRecord[]>([]);

  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    if (token) {
      // In a real app, we'd verify the token and get user data
      // For now, we'll assume it's valid if present
      const savedUser = localStorage.getItem('medico_user');
      if (savedUser) setUser(JSON.parse(savedUser));
      setView('dashboard');
      fetchScores();
    } else {
      setView('auth');
    }
  }, [token]);

  const fetchScores = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/scores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setScores(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('medico_token', data.token);
        localStorage.setItem('medico_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('medico_token');
    localStorage.removeItem('medico_user');
    setToken(null);
    setUser(null);
    setView('auth');
  };

  const saveScore = async (subject: string, chapter: string, score: number, total: number) => {
    if (!token) return;
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, chapter, score, total })
      });
      fetchScores();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      {user && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Stethoscope size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Medico<span className="text-indigo-600">MBBS</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('report')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <Trophy size={20} />
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1">MBBS Student</p>
              </div>
              <button onClick={logout} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-slate-400">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {view === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto mt-20"
            >
              <Card className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mx-auto mb-4">
                    <Stethoscope size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                  <p className="text-slate-500 mt-2">Your medical learning companion</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <Input 
                      placeholder="Full Name" 
                      value={authData.name} 
                      onChange={e => setAuthData({...authData, name: e.target.value})}
                      required
                    />
                  )}
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={authData.email} 
                    onChange={e => setAuthData({...authData, email: e.target.value})}
                    required
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={authData.password} 
                    onChange={e => setAuthData({...authData, password: e.target.value})}
                    required
                  />
                  <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Medical Subjects</h2>
                  <p className="text-slate-500 mt-1">Select a subject to start practicing</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                    <Flame className="text-orange-500" size={20} />
                    <span className="font-bold text-slate-700">7 Day Streak</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MBBS_SUBJECTS.map((subject, idx) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="group cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all h-full flex flex-col"
                      onClick={() => {
                        setSelectedSubject(subject);
                        setView('subject');
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <BookOpen size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{subject.chapters.length} Chapters</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{subject.name}</h3>
                      <p className="text-sm text-slate-500 flex-grow">Comprehensive study material and practice questions for {subject.name}.</p>
                      <div className="mt-6 flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        Explore Chapters <ChevronRight size={16} />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'subject' && selectedSubject && (
            <motion.div 
              key="subject"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
              >
                <ArrowLeft size={20} /> Back to Subjects
              </button>

              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold mb-2">{selectedSubject.name}</h2>
                  <p className="text-indigo-100 max-w-lg">Master the core concepts of {selectedSubject.name} through interactive learning and AI-powered assessments.</p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Stethoscope size={200} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubject.chapters.map((chapter, idx) => (
                  <Card key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-800">{chapter}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="outline" 
                          className="px-3 py-1.5 text-xs rounded-lg"
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setView('flashcards');
                          }}
                        >
                          <Brain size={14} className="mr-1 inline" /> Flashcards
                        </Button>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Qty:</span>
                          <input 
                            type="number"
                            className="text-[10px] w-8 focus:outline-none"
                            value={flashcardCount}
                            min={1}
                            max={50}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setFlashcardCount('');
                              } else {
                                const num = parseInt(val);
                                if (!isNaN(num)) setFlashcardCount(Math.min(50, num));
                              }
                            }}
                            onBlur={() => {
                              if (flashcardCount === '' || Number(flashcardCount) < 1) {
                                setFlashcardCount(1);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="primary" 
                          className="px-3 py-1.5 text-xs rounded-lg"
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setView('practice');
                          }}
                        >
                          <Layout size={14} className="mr-1 inline" /> Practice
                        </Button>
                        <select 
                          className="text-[10px] bg-white border border-slate-200 rounded p-0.5"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Qty:</span>
                          <input 
                            type="number"
                            className="text-[10px] w-8 focus:outline-none"
                            value={questionCount}
                            min={1}
                            max={50}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setQuestionCount('');
                              } else {
                                const num = parseInt(val);
                                if (!isNaN(num)) setQuestionCount(Math.min(50, num));
                              }
                            }}
                            onBlur={() => {
                              if (questionCount === '' || Number(questionCount) < 1) {
                                setQuestionCount(1);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'practice' && selectedSubject && selectedChapter && (
            <PracticeView 
              subject={selectedSubject.name} 
              chapter={selectedChapter} 
              initialCount={Number(questionCount) || 5}
              difficulty={difficulty}
              onComplete={(score, total) => {
                saveScore(selectedSubject.name, selectedChapter, score, total);
                setView('subject');
              }}
              onCancel={() => setView('subject')}
            />
          )}

          {view === 'flashcards' && selectedSubject && selectedChapter && (
            <FlashcardView 
              subject={selectedSubject.name} 
              chapter={selectedChapter} 
              initialCount={Number(flashcardCount) || 10}
              onCancel={() => setView('subject')}
            />
          )}

          {view === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Performance Report</h2>
                  <p className="text-slate-500 mt-1">Track your progress across all subjects</p>
                </div>
                <Button variant="outline" onClick={() => setView('dashboard')}>
                  <ArrowLeft size={20} className="mr-2 inline" /> Dashboard
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-indigo-600 text-white">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Total Quizzes</p>
                  <p className="text-4xl font-bold mt-2">{scores.length}</p>
                </Card>
                <Card>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Avg. Accuracy</p>
                  <p className="text-4xl font-bold mt-2 text-slate-800">
                    {scores.length > 0 
                      ? Math.round((scores.reduce((acc, s) => acc + (s.score / s.total), 0) / scores.length) * 100)
                      : 0}%
                  </p>
                </Card>
                <Card>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Questions</p>
                  <p className="text-4xl font-bold mt-2 text-slate-800">
                    {scores.reduce((acc, s) => acc + s.total, 0)}
                  </p>
                </Card>
              </div>

              <Card className="overflow-hidden p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-bold">Subject</th>
                        <th className="px-6 py-4 font-bold">Chapter</th>
                        <th className="px-6 py-4 font-bold">Score</th>
                        <th className="px-6 py-4 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scores.map((score) => (
                        <tr key={score.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{score.subject}</td>
                          <td className="px-6 py-4 text-slate-600">{score.chapter}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-bold",
                                score.score / score.total >= 0.8 ? "text-emerald-600" : 
                                score.score / score.total >= 0.5 ? "text-orange-600" : "text-red-600"
                              )}>
                                {score.score}/{score.total}
                              </span>
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full",
                                    score.score / score.total >= 0.8 ? "bg-emerald-500" : 
                                    score.score / score.total >= 0.5 ? "bg-orange-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${(score.score / score.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(score.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {scores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                            No practice records found. Start learning to see your progress!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Practice View Component ---

function PracticeView({ 
  subject, 
  chapter, 
  initialCount,
  difficulty,
  onComplete, 
  onCancel 
}: { 
  subject: string; 
  chapter: string; 
  initialCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (score: number, total: number) => void; 
  onCancel: () => void 
}) {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingMore, setGeneratingMore] = useState(false);

  const loadQuestions = async (count: number) => {
    try {
      const data = await generateMCQs(subject, chapter, count, difficulty);
      setMcqs(prev => [...prev, ...data]);
    } catch (e) {
      alert('Failed to generate MCQs');
      if (mcqs.length === 0) onCancel();
    } finally {
      setLoading(false);
      setGeneratingMore(false);
    }
  };

  useEffect(() => {
    loadQuestions(initialCount);
  }, []);

  const handleNext = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Show summary or allow generating more
      setShowExplanation(true); // Keep explanation visible for last question
    }
  };

  const handleGenerateMore = async () => {
    setGeneratingMore(true);
    await loadQuestions(5);
    setCurrentIndex(currentIndex + 1);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === mcqs[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Gemini is generating high-quality MCQs for you...</p>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Question {currentIndex + 1}/{mcqs.length}</span>
          <span className="text-sm font-medium text-slate-400">{chapter}</span>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><RotateCcw size={20} /></button>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-600" 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
        />
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{currentMCQ.question}</h3>
        <div className="space-y-3">
          {currentMCQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentMCQ.correctAnswer;
            const showResult = selectedOption !== null;

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group",
                  !showResult && "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30",
                  showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                  showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 text-red-900",
                  showResult && !isSelected && !isCorrect && "border-slate-100 opacity-50"
                )}
              >
                <span className="font-medium">{option}</span>
                {showResult && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                {showResult && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Brain size={18} className="text-indigo-600" /> Explanation
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{currentMCQ.explanation}</p>
              
              <div className="mt-6 flex flex-col gap-3">
                {currentIndex < mcqs.length - 1 ? (
                  <Button onClick={handleNext} className="w-full">
                    Next Question
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                      <p className="text-indigo-900 font-bold">Session Complete!</p>
                      <p className="text-indigo-700 text-sm">You scored {score} out of {mcqs.length}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleGenerateMore} className="flex-1" variant="secondary" disabled={generatingMore}>
                        {generatingMore ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Generate 5 More'}
                      </Button>
                      <Button onClick={() => onComplete(score, mcqs.length)} className="flex-1">
                        Finish & Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// --- Flashcard View Component ---

function FlashcardView({ 
  subject, 
  chapter, 
  initialCount,
  onCancel 
}: { 
  subject: string; 
  chapter: string; 
  initialCount: number;
  onCancel: () => void 
}) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingMore, setGeneratingMore] = useState(false);

  const loadCards = async (count: number) => {
    try {
      const data = await generateFlashcards(subject, chapter, count);
      setCards(prev => [...prev, ...data]);
    } catch (e) {
      alert('Failed to generate flashcards');
      if (cards.length === 0) onCancel();
    } finally {
      setLoading(false);
      setGeneratingMore(false);
    }
  };

  useEffect(() => {
    loadCards(initialCount);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Gemini is preparing your flashcards...</p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // End of cards reached
    }
  };

  const handleGenerateMore = async () => {
    setGeneratingMore(true);
    await loadCards(5);
    setCurrentIndex(currentIndex + 1);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Card {currentIndex + 1}/{cards.length}</span>
          <span className="text-sm font-medium text-slate-400">{chapter}</span>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">Close</button>
      </div>

      <div 
        className="relative h-80 w-full cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div 
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl border-2 border-slate-100 shadow-xl flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Question</p>
            <h3 className="text-2xl font-bold text-slate-800 leading-tight">{cards[currentIndex].front}</h3>
            <p className="mt-12 text-slate-400 text-sm font-medium">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-4">Answer</p>
            <p className="text-xl font-medium leading-relaxed">{cards[currentIndex].back}</p>
            <p className="mt-12 text-indigo-200 text-sm font-medium">Click to flip back</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" className="flex-1 py-4" onClick={handlePrev} disabled={currentIndex === 0}>
          Previous
        </Button>
        {currentIndex < cards.length - 1 ? (
          <Button variant="primary" className="flex-1 py-4" onClick={handleNext}>
            Next Card
          </Button>
        ) : (
          <div className="flex-1 flex gap-2">
            <Button variant="secondary" className="flex-1 py-4" onClick={handleGenerateMore} disabled={generatingMore}>
              {generatingMore ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Generate 5 More'}
            </Button>
            <Button variant="primary" className="flex-1 py-4" onClick={onCancel}>
              Finish
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

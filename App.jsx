
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, ChevronLeft, Activity, History, Trash2, 
  FlipHorizontal, CheckCircle, Crown, CreditCard, 
  Share2, Settings, BarChart3, ShieldAlert, Heart, Copy, Info, Sparkles
} from 'lucide-react';
import { analyzeTongueImage } from './services/geminiService';
import { AppState, HealthAnalysis, Language, HistoryEntry } from './types';

const STORAGE_KEY = 'tongue_health_pro_v3';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('HOME');
  const [lang, setLang] = useState<Language>('hi');
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [adminCounter, setAdminCounter] = useState(0);
  const [copying, setCopying] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Simulate progress bar during analysis
  useEffect(() => {
    let interval: any;
    if (view === 'ANALYZING') {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress(prev => (prev < 90 ? prev + Math.random() * 15 : prev));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [view]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }, []);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setView('SCANNING');
      }
    } catch (e) {
      alert(lang === 'hi' ? "कैमरा शुरू नहीं हुआ! कृपया सेटिंग्स में अनुमति दें।" : "Camera access denied! Please check settings.");
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    stopCamera();
    setView('ANALYZING');
    try {
      const res = await analyzeTongueImage(base64, lang);
      setAnalysis(res);
      const entry: HistoryEntry = { ...res, id: Date.now().toString() };
      const newHistory = [entry, ...history];
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setView('RESULT');
    } catch (e) {
      alert("AI analysis failed. Try again with a clearer photo.");
      setView('HOME');
    }
  };

  const deleteRecord = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const copyToClipboard = () => {
    if (!analysis) return;
    const text = `TongueHealth AI Report\n--------------------\nStatus: ${analysis.healthStatus}\nEst. Hb: ${analysis.hemoglobinEstimate}\nFindings: ${analysis.observations.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 flex flex-col relative font-sans select-none overflow-hidden">
      {/* Dynamic Header */}
      <header className="p-5 bg-white/90 backdrop-blur-xl border-b flex justify-between items-center sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-3" onClick={() => setAdminCounter(c => (c + 1 >= 7 ? 0 : c + 1))}>
          <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/30 animate-pulse">
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-none tracking-tight">TongueHealth</h1>
            <span className="text-[10px] font-black text-teal-600 tracking-widest uppercase opacity-70">AI Diagnostic</span>
          </div>
        </div>
        <button 
          onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')}
          className="text-[10px] font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full uppercase tracking-tighter active:scale-95 transition-all shadow-md shadow-slate-900/10"
        >
          {lang === 'hi' ? 'English' : 'हिंदी'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {view === 'HOME' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="relative p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white overflow-hidden shadow-2xl">
               <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl"></div>
               <div className="relative z-10 space-y-4">
                  <div className="bg-teal-500 w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
                    <Sparkles size={10} /> {lang === 'hi' ? 'स्मार्ट स्कैन' : 'Smart Scan'}
                  </div>
                  <h2 className="text-3xl font-black leading-tight">
                    {lang === 'hi' ? 'जीभ देख कर\nसेहत का हाल जानें' : 'Read Health\nFrom Your Tongue'}
                  </h2>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed">
                    {lang === 'hi' 
                      ? 'AI की मदद से अपने हीमोग्लोबिन और विटल्स का अनुमान लगाएं।' 
                      : 'Estimate Hb levels and vital markers using medical-grade AI vision.'}
                  </p>
               </div>
            </div>

            <div className="relative flex justify-center py-4">
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-48 h-48 bg-teal-100/50 rounded-full animate-ping opacity-30"></div>
              </div>
              <button 
                onClick={startScan}
                className="relative w-32 h-32 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-slate-50 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all hover:border-teal-100 group"
              >
                <Camera size={36} className="text-slate-900 group-hover:text-teal-600 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'hi' ? 'स्कैन' : 'Scan'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Heart size={20} />, label: lang === 'hi' ? 'Hb स्तर' : 'Hb Level', color: 'text-rose-500' },
                { icon: <ShieldAlert size={20} />, label: lang === 'hi' ? 'अलर्ट' : 'Alerts', color: 'text-blue-500' },
                { icon: <History size={20} />, label: lang === 'hi' ? 'इतिहास' : 'History', color: 'text-amber-500' },
                { icon: <CheckCircle size={20} />, label: lang === 'hi' ? 'सटीक' : 'Accuracy', color: 'text-teal-500' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'SCANNING' && (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-96 border-4 border-white/20 rounded-[4rem] relative shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 border border-teal-400/30 rounded-[3.8rem]"></div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-teal-400/40 blur-sm animate-pulse"></div>
              </div>
            </div>
            <div className="p-12 flex justify-between items-center bg-gradient-to-t from-black to-transparent pb-24">
              <button onClick={() => { stopCamera(); setView('HOME'); }} className="text-white p-5 bg-white/10 rounded-full backdrop-blur-xl border border-white/10 active:scale-90 transition-all">
                <ChevronLeft size={32} />
              </button>
              <button onClick={capture} className="w-24 h-24 bg-white rounded-full p-2 shadow-2xl active:scale-95 transition-all">
                <div className="w-full h-full rounded-full border-8 border-slate-900 bg-white flex items-center justify-center">
                   <div className="w-10 h-10 bg-teal-600 rounded-full animate-pulse shadow-inner"></div>
                </div>
              </button>
              <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="text-white p-5 bg-white/10 rounded-full backdrop-blur-xl border border-white/10 active:scale-90 transition-all">
                <FlipHorizontal size={32} />
              </button>
            </div>
          </div>
        )}

        {view === 'ANALYZING' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[70vh]">
            <div className="relative mb-8">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * loadingProgress) / 100} className="text-teal-600 transition-all duration-300" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={40} className="text-teal-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">{lang === 'hi' ? 'डिकोडिंग जारी है' : 'Decoding Signals'}</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">{lang === 'hi' ? 'AI प्रोसेसिंग' : 'Processing Bio-Markers'}</p>
          </div>
        )}

        {view === 'RESULT' && analysis && (
          <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={120} /></div>
               <div className="relative z-10 text-center">
                  <div className={`mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center ${analysis.healthStatus === 'Excellent' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'hi' ? 'हेल्थ स्कोर' : 'Overall Status'}</p>
                  <h2 className={`text-6xl font-black mb-6 ${
                    analysis.healthStatus === 'Excellent' ? 'text-teal-600' : 'text-amber-500'
                  }`}>{analysis.healthStatus}</h2>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic font-bold text-slate-600 leading-relaxed">
                    "{analysis.description}"
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{lang === 'hi' ? 'हीमोग्लोबिन अनुमान' : 'Estimated Hb'}</p>
                  <h3 className="text-7xl font-black text-rose-500 drop-shadow-lg">{analysis.hemoglobinEstimate}</h3>
                  <p className="text-xs font-bold opacity-30 mt-1 uppercase tracking-tighter">Grams per Decilitre (g/dL)</p>
                </div>
                <button onClick={copyToClipboard} className={`p-4 rounded-2xl transition-all ${copying ? 'bg-teal-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                  {copying ? <CheckCircle size={24}/> : <Copy size={24} />}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-5">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{lang === 'hi' ? 'मुख्य विश्लेषण' : 'Analysis Points'}</h4>
              <div className="space-y-3">
                {analysis.observations.map((o, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-[1.8rem] font-bold text-slate-700 text-sm border border-slate-100/50">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 mt-1.5 shrink-0 shadow-lg shadow-teal-500/50"></div>
                    {o}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setView('HOME')} className="w-full py-7 rounded-[2.5rem] font-black text-white bg-teal-600 shadow-xl shadow-teal-600/20 active:scale-95 transition-all text-xl">
              {lang === 'hi' ? 'नया स्कैन करें' : 'Start New Session'}
            </button>
          </div>
        )}

        {view === 'HISTORY' && (
          <div className="p-6 space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-3xl font-black text-slate-800">{lang === 'hi' ? 'पुराने रिकॉर्ड' : 'Log History'}</h2>
              <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest">{history.length} ITEMS</div>
            </div>
            
            {history.length === 0 ? (
              <div className="py-32 text-center space-y-6 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                  <History size={48} />
                </div>
                <p className="text-slate-400 font-bold max-w-[200px] leading-relaxed">{lang === 'hi' ? 'अभी तक कोई स्कैन नहीं मिला है।' : 'Your local scan history is currently empty.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(h => (
                  <div key={h.id} className="group relative">
                    <div onClick={() => { setAnalysis(h); setView('RESULT'); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:border-teal-100">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">{new Date(h.timestamp).toLocaleDateString()}</p>
                        <h4 className="text-3xl font-black text-slate-800">{h.hemoglobinEstimate} <span className="text-xs opacity-20">g/dL</span></h4>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${h.healthStatus === 'Excellent' ? 'bg-teal-500' : 'bg-amber-500'}`}></span>
                          <p className="text-xs font-black text-slate-400 uppercase">{h.healthStatus}</p>
                        </div>
                      </div>
                      <ChevronLeft className="rotate-180 text-slate-300 group-hover:text-teal-600 transition-colors" size={28} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteRecord(h.id); }}
                      className="absolute -top-3 -right-3 p-3 bg-rose-500 text-white rounded-2xl shadow-xl border-4 border-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Navigation */}
      {(view === 'HOME' || view === 'HISTORY') && (
        <nav className="fixed bottom-10 left-10 right-10 bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-2 flex items-center shadow-2xl border border-white/10 z-[100]">
          <button 
            onClick={() => setView('HOME')} 
            className={`flex-1 py-5 rounded-[2.8rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all ${view === 'HOME' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-500'}`}
          >
            <Camera size={20} /> {lang === 'hi' ? 'स्कैन' : 'Scan'}
          </button>
          <button 
            onClick={() => setView('HISTORY')} 
            className={`flex-1 py-5 rounded-[2.8rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all ${view === 'HISTORY' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-500'}`}
          >
            <History size={20} /> {lang === 'hi' ? 'लॉग' : 'Logs'}
          </button>
        </nav>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <footer className="p-10 text-[9px] text-slate-400 text-center font-bold tracking-widest uppercase opacity-20 italic">
        Medical Notice: AI interpretation is for data tracking only.
      </footer>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DiaryEntry, Mood, InsightData, MoodDataPoint, AiConfig, UserConfig, AiFan, AiStyle, SubscriptionTier, ChatMessage } from './types';
import { STORAGE_KEY, MOOD_SCORES } from './constants';
import { PostCard } from './components/PostCard';
import { MoodPicker } from './components/MoodPicker';
import { MoodChart } from './components/MoodChart';
import { InsightPanel } from './components/InsightPanel';
import DeepChat from './components/DeepChat';
import DecisionHelper from './components/DecisionHelper';
import { locales, Language } from './locales';
import { 
  Heart, Home, BarChart2, User, Image as ImageIcon, Mic, Shield, Globe, Users, 
  Loader2, Sparkle, X, Camera, Palette, Wallet, Star, Trash2, Coins, ArrowRight, ChevronDown, Dice5, Languages, Edit2, Plus, ChevronRight, Upload, Crown, Sparkles,
  ChevronLeft, Search, Calendar, Filter, Check, Info, AlertCircle, CheckCircle
} from 'lucide-react';

const USER_STORAGE_KEY = 'ai_large_user_config';
const THEME_STORAGE_KEY = 'ai_large_theme_color';
const FANS_STORAGE_KEY = 'ai_large_fans_config';
const ONBOARDING_KEY = 'ai_large_onboarding_completed';

const App: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>('😊');
  const [privacy, setPrivacy] = useState<DiaryEntry['privacy']>('private');
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'stats' | 'dilemma' | 'profile'>('feed');
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');
  
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [showAddFanModal, setShowAddFanModal] = useState(false);
  const [editingFan, setEditingFan] = useState<AiFan | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showTierDetails, setShowTierDetails] = useState(false);
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const [showInsufficientPoints, setShowInsufficientPoints] = useState<number | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<{type: 'recharge' | 'upgrade', msg: string} | null>(null);

  // Calendar State
  const [showCalendarOverlay, setShowCalendarOverlay] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) || 'pink');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);

  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'zh');
  const aiConfig: AiConfig = { name: 'Large', avatar: '🐶' };

  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          subscriptionTier: parsed.subscriptionTier || 'free',
          dailyPostsCount: parsed.dailyPostsCount || 0,
          dailyFlowCount: parsed.dailyFlowCount || 0,
          lastResetDate: parsed.lastResetDate || today,
          points: typeof parsed.points === 'number' ? parsed.points : 10
        };
      } catch (e) { console.error(e); }
    }
    return { name: '', avatar: '😊', isWeb3Connected: false, points: 10, subscriptionTier: 'free', dailyPostsCount: 0, dailyFlowCount: 0, lastResetDate: today };
  });

  const [fans, setFans] = useState<AiFan[]>(() => {
    const saved = localStorage.getItem(FANS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [newFan, setNewFan] = useState<{name: string, style: AiStyle, avatar: string}>({
    name: '', style: 'warm', avatar: '✨'
  });

  const [editName, setEditName] = useState(userConfig.name);
  const [activeDeepChat, setActiveDeepChat] = useState<{entryId: string, fanId?: string} | null>(null);
  const activeDeepChatEntry = useMemo(() => activeDeepChat ? entries.find(e => e.id === activeDeepChat.entryId) : null, [entries, activeDeepChat]);

  const [insights, setInsights] = useState<InsightData>({ summary: '', patterns: [], triggers: [], growthAdvice: [], topTopics: [], period: 'weekly' });
  const [loadingInsights, setLoadingInsights] = useState(false);
  const lastAnalyzedState = useRef({ entriesCount: 0, totalChatMessages: 0, period: '', lang: '' });
  const t = locales[lang];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (userConfig.lastResetDate !== today) {
      setUserConfig(prev => ({ ...prev, dailyPostsCount: 0, dailyFlowCount: 0, lastResetDate: today }));
    }
  }, [activeTab, userConfig.lastResetDate]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = (parsed as any[]).map(entry => {
          if (Array.isArray(entry.deepChat)) return { ...entry, deepChat: { 'default': entry.deepChat } };
          return entry;
        });
        setEntries(migrated);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      setEntries(prev => prev.slice(0, 50)); 
    }
  }, [entries]);

  useEffect(() => localStorage.setItem('app_lang', lang), [lang]);
  useEffect(() => localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userConfig)), [userConfig]);
  useEffect(() => localStorage.setItem(THEME_STORAGE_KEY, themeColor), [themeColor]);
  useEffect(() => localStorage.setItem(FANS_STORAGE_KEY, JSON.stringify(fans)), [fans]);

  useEffect(() => {
    const totalChatMessages = entries.reduce<number>((sum, e) => sum + Object.values(e.deepChat || {}).reduce<number>((s, arr) => s + (arr as ChatMessage[]).length, 0), 0);
    const hasMeaningfulChanges = entries.length !== lastAnalyzedState.current.entriesCount || totalChatMessages !== lastAnalyzedState.current.totalChatMessages || reportPeriod !== lastAnalyzedState.current.period || lang !== lastAnalyzedState.current.lang;
    if (activeTab === 'stats' && entries.length > 0 && hasMeaningfulChanges) {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        const data = await generateInsights(entries, reportPeriod, lang);
        setInsights(data);
        lastAnalyzedState.current = { entriesCount: entries.length, totalChatMessages, period: reportPeriod, lang };
        setLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [activeTab, entries, reportPeriod, lang]);

  const moodData: MoodDataPoint[] = useMemo(() => {
    return [...entries].slice(0, 7).reverse().map(e => ({
      date: new Date(e.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
      score: MOOD_SCORES[e.mood],
      mood: e.mood
    }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return entries;
    return entries.filter(e => {
      const start = filterStartDate ? new Date(filterStartDate).setHours(0, 0, 0, 0) : 0;
      const end = filterEndDate ? new Date(filterEndDate).setHours(23, 59, 59, 999) : Infinity;
      return e.timestamp >= start && e.timestamp <= end;
    });
  }, [entries, filterStartDate, filterEndDate]);

  const stats = useMemo(() => ({
    entryCount: entries.length,
    streak: entries.length > 0 ? Math.max(1, Math.ceil((Date.now() - entries[0].timestamp) / (1000 * 60 * 60 * 24))) : 0
  }), [entries]);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setVoiceData(reader.result as string);
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { alert(lang === 'zh' ? "录音失败" : "Recording failed"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } else setIsRecording(false);
  };

  /**
   * Post-payment helper to jump back and show confirmation
   */
  const handlePaymentSuccess = (type: 'recharge' | 'upgrade') => {
    const msg = type === 'recharge' ? t.pointsRechargeSuccess : t.update;
    setShowSuccessOverlay({ type, msg });
    setShowInsufficientPoints(null);
    setShowTierDetails(false);
    setLimitReason(null);
    
    // Auto-dismiss success overlay
    setTimeout(() => {
      setShowSuccessOverlay(null);
    }, 1800);
  };

  const handleMetaMaskRecharge = async () => {
    if (isRecharging) return;
    const eth = (window as any).ethereum;
    if (!eth) { alert(t.metaMaskNotFound); return; }
    try {
      setIsRecharging(true);
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      await eth.request({
        method: 'eth_sendTransaction',
        params: [{ to: accounts[0], from: accounts[0], value: '0x38D7EA4C68000' }],
      });
      setUserConfig(prev => ({ ...prev, isWeb3Connected: true, walletAddress: accounts[0], points: (prev.points || 0) + 100 }));
      handlePaymentSuccess('recharge');
    } catch (error) {
      // Demo fallback for restricted environments
      setUserConfig(prev => ({ ...prev, points: (prev.points || 0) + 100 }));
      handlePaymentSuccess('recharge');
    } finally { setIsRecharging(false); }
  };

  const handleTryAddFan = () => {
    if (userConfig.points < 10) setShowInsufficientPoints(10);
    else if (fans.length >= 5) alert(t.maxFans);
    else setShowAddFanModal(true);
  };

  const handleAddFan = () => {
    if (!newFan.name.trim() || userConfig.points < 10 || fans.length >= 5) return;
    setFans([...fans, { id: Date.now().toString(), name: newFan.name, style: newFan.style, avatar: newFan.avatar, isActive: true }]);
    setUserConfig(prev => ({ ...prev, points: Math.max(0, prev.points - 10) }));
    setNewFan({ name: '', style: 'warm', avatar: '✨' });
    setShowAddFanModal(false);
  };

  const checkPostLimit = () => {
    if (userConfig.subscriptionTier === 'premium') return true;
    const limit = userConfig.subscriptionTier === 'basic' ? 2 : 1;
    if (userConfig.dailyPostsCount >= limit) {
      setLimitReason(t.limitReachedPost);
      setShowTierDetails(true);
      return false;
    }
    return true;
  };

  const handlePost = async () => {
    if ((!content.trim() && !voiceData && !imagePreview) || isPosting || !checkPostLimit()) return;
    setIsPosting(true);
    try {
      const aiComments = await generateAiComment(content.trim() || "[Media]", selectedMood, lang, userConfig.name, imagePreview || undefined, fans);
      setEntries([{ id: Date.now().toString(), content: content.trim() || (lang === 'zh' ? '心情碎碎念' : 'Mood thoughts'), mood: selectedMood, timestamp: Date.now(), aiComments, deepChat: {}, privacy, imageUrl: imagePreview || undefined, voiceData: voiceData || undefined }, ...entries]);
      setUserConfig(prev => ({ ...prev, dailyPostsCount: prev.dailyPostsCount + 1 }));
      setContent(''); setImagePreview(null); setVoiceData(null); setSelectedMood('😊');
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const processImageUpload = (file: File, callback: (base64: string) => void, maxSize = 800) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTierSelect = (tier: SubscriptionTier) => {
    if (tier === userConfig.subscriptionTier) return;
    let cost = tier === 'free' ? 0 : tier === 'basic' ? 50 : 69;
    if (userConfig.points < cost) { setShowInsufficientPoints(cost); return; }
    setUserConfig(prev => ({ ...prev, subscriptionTier: tier, points: prev.points - cost }));
    handlePaymentSuccess('upgrade');
  };

  const calendarDays = useMemo(() => {
    const year = calendarViewMonth.getFullYear(), month = calendarViewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  }, [calendarViewMonth]);

  const entriesByDateMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    entries.forEach(e => {
      const d = new Date(e.timestamp);
      map[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = true;
    });
    return map;
  }, [entries]);

  const nextMonth = () => setCalendarViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () => setCalendarViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  const handleEnterApp = () => {
    setShowSplash(false);
    if (!userConfig.name.trim()) setShowLogin(true);
  };

  const handleLoginSubmit = () => {
    if (userConfig.name.trim()) {
      setShowLogin(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  };

  if (showSplash) return (
    <div onClick={handleEnterApp} className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-700">
      <div className="animate-bounce mb-8">
        <div className={`w-28 h-28 bg-gradient-to-tr from-${themeColor}-400 to-purple-400 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-white`}><Heart className="text-white" size={56} fill="white" /></div>
      </div>
      <h1 className="text-5xl font-black text-gray-800 tracking-tighter mb-4">{t.appName}</h1>
      <p className={`text-base font-bold text-${themeColor}-400 uppercase tracking-widest text-center px-8`}>{t.splashSlogan}</p>
      <div className="flex flex-col items-center gap-4 animate-pulse absolute bottom-24">
        <span className="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">{t.clickToEnter}</span>
        <ChevronDown className="text-gray-300" size={24} />
      </div>
    </div>
  );

  if (showLogin) return (
    <div className="fixed inset-0 z-[1001] bg-white flex flex-col p-8 items-center justify-center text-center animate-in fade-in duration-500 overflow-y-auto">
      <div className="mb-12 space-y-6 w-full max-sm">
        <div className="relative mx-auto group w-32 h-32">
          <div className={`w-full h-full bg-white border-4 border-${themeColor}-100 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-6xl overflow-hidden shadow-${themeColor}-100`}>
            {userConfig.avatar.startsWith('data:image') ? <img src={userConfig.avatar} className="w-full h-full object-cover" alt="avatar" /> : userConfig.avatar}
          </div>
          <label className={`absolute -bottom-2 -right-2 w-10 h-10 bg-${themeColor}-600 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg cursor-pointer transition-all active:scale-90`}><Camera size={18} /><input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) processImageUpload(f, (base64) => setUserConfig(prev => ({ ...prev, avatar: base64 })), 400); }} /></label>
        </div>
        <div className="space-y-2"><h2 className="text-3xl font-black text-gray-800 tracking-tight">{t.welcome}</h2><p className="text-gray-400 font-medium text-sm leading-relaxed">{t.loginIntro}</p></div>
      </div>
      <div className="w-full max-w-sm space-y-10">
        <input type="text" value={userConfig.name} onChange={(e) => setUserConfig(prev => ({ ...prev, name: e.target.value }))} placeholder={t.nicknamePlaceholder} className={`w-full h-18 px-6 bg-gray-50 border-2 border-transparent focus:border-${themeColor}-200 rounded-[2rem] outline-none font-bold text-center text-xl transition-all shadow-inner`} />
        <button onClick={handleLoginSubmit} disabled={!userConfig.name.trim()} className={`w-full h-18 bg-${themeColor}-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30`}>{t.startNow}<ArrowRight size={22} /></button>
      </div>
    </div>
  );

  return (
    <div className={`max-w-xl mx-auto min-h-screen bg-[#fffafa] flex flex-col pb-24 overflow-x-hidden selection:bg-${themeColor}-100`}>
      <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-${themeColor}-50 px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3"><div className={`w-10 h-10 bg-gradient-to-tr from-${themeColor}-400 to-purple-400 rounded-[1.2rem] flex items-center justify-center shadow-lg border-2 border-white`}><Heart className="text-white" size={20} fill="white" /></div><h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">{t.appName}</h1></div>
        <div className="flex items-center gap-2">
          {activeTab === 'feed' && <button onClick={() => setShowFilter(!showFilter)} className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${showFilter || filterStartDate || filterEndDate ? `bg-${themeColor}-600 text-white` : `bg-${themeColor}-50 text-${themeColor}-500`}`}><Search size={18} /></button>}
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className={`w-10 h-10 flex items-center justify-center bg-${themeColor}-50 text-${themeColor}-500 rounded-2xl`}><Languages size={18} /></button>
        </div>
      </header>

      <main className="flex-1 p-5 space-y-8">
        {activeTab === 'feed' && (
          <>
            {showFilter && (
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border-2 border-gray-50 space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 mb-2"><Calendar size={14} className={`text-${themeColor}-500`} /><h3 className="text-xs font-black uppercase tracking-widest text-gray-800">{t.searchHistory}</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.startDate}</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold text-gray-600 outline-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.endDate}</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold text-gray-600 outline-none" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setShowFilter(false); }} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black tracking-widest">CLEAR</button>
                  <button onClick={() => setShowFilter(false)} className={`flex-1 py-3 bg-${themeColor}-600 text-white rounded-xl text-[10px] font-black tracking-widest shadow-lg`}>FILTER</button>
                </div>
              </div>
            )}
            {!showFilter && !filterStartDate && !filterEndDate && (
              <section className={`bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-${themeColor}-50 relative group`}>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.postPlaceholder} className="w-full resize-none border-none focus:ring-0 text-lg font-medium text-gray-700 min-h-[100px] bg-transparent" />
                <div className="flex flex-wrap gap-3 mb-4">
                  {imagePreview && <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-pink-100 shadow-sm"><img src={imagePreview} className="w-full h-full object-cover" /><button onClick={() => setImagePreview(null)} className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full"><X size={12} /></button></div>}
                  {voiceData && <div className={`flex items-center gap-2 px-3 py-2 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl border`}><Mic size={14} /><span className="text-[10px] font-black tracking-widest">{t.voiceNote}</span><button onClick={() => setVoiceData(null)}><X size={12}/></button></div>}
                </div>
                <MoodPicker selected={selectedMood} onSelect={setSelectedMood} themeColor={themeColor} />
                <div className={`flex items-center justify-between border-t-2 border-${themeColor}-50 pt-4 mt-2`}>
                  <div className="flex items-center gap-2">
                    <label className={`p-2.5 rounded-2xl text-${themeColor}-400 cursor-pointer active:scale-90 transition-all`}><ImageIcon size={22} /><input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) processImageUpload(f, setImagePreview, 1200); }}/></label>
                    <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isRecording ? 'text-rose-500 animate-pulse bg-rose-50' : `text-${themeColor}-400`}`}><Mic size={22}/></button>
                  </div>
                  <button onClick={handlePost} disabled={(!content.trim() && !voiceData && !imagePreview) || isPosting} className={`px-8 h-12 rounded-[1.5rem] font-black uppercase tracking-widest transition-all ${content.trim() || voiceData || imagePreview ? `bg-gradient-to-r from-${themeColor}-500 to-purple-500 text-white shadow-lg active:scale-95` : 'bg-gray-100 text-gray-300'}`}>{isPosting ? <Loader2 className="animate-spin" size={20} /> : t.post}</button>
                </div>
              </section>
            )}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? <div className="text-center py-20 text-gray-400 italic text-sm">{t.postFirst}</div> : filteredEntries.map(entry => <PostCard key={entry.id} entry={entry} onOpenChat={(entryId, fanId) => setActiveDeepChat({ entryId, fanId })} lang={lang} aiConfig={aiConfig} userConfig={userConfig} themeColor={themeColor} />)}
            </div>
          </>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-black text-gray-800">{t.moodTrend}</h2><div className="flex bg-gray-50 p-1 rounded-xl"><button onClick={() => setReportPeriod('weekly')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${reportPeriod === 'weekly' ? `bg-white text-${themeColor}-600` : 'text-gray-400'}`}>{t.week}</button><button onClick={() => setReportPeriod('monthly')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${reportPeriod === 'monthly' ? `bg-white text-${themeColor}-600` : 'text-gray-400'}`}>{t.month}</button></div></div>
              <MoodChart data={moodData} themeColor={themeColor} />
            </div>
            <InsightPanel insights={insights} loading={loadingInsights} lang={lang} themeColor={themeColor} />
          </div>
        )}

        {activeTab === 'dilemma' && (
          <DecisionHelper 
            lang={lang} 
            themeColor={themeColor} 
            canUseFlow={userConfig.subscriptionTier === 'premium' || userConfig.dailyFlowCount < (userConfig.subscriptionTier === 'basic' ? 5 : 1)} 
            onFlowUsed={() => setUserConfig(prev => ({ ...prev, dailyFlowCount: prev.dailyFlowCount + 1 }))}
            onLimitReached={() => {
              setLimitReason(t.limitReachedFlow);
              setShowTierDetails(true);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-${themeColor}-50 flex flex-col items-center text-center relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 p-4 opacity-5 text-${themeColor}-500`}><Star size={80} fill="currentColor" /></div>
              <div onClick={() => { setShowProfileEdit(true); setEditName(userConfig.name); }} className="relative mb-6 cursor-pointer active:scale-95 transition-all"><div className={`w-28 h-28 rounded-[2.5rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center text-5xl overflow-hidden relative shadow-${themeColor}-100`}>{userConfig.avatar.startsWith('data:image') ? <img src={userConfig.avatar} className="w-full h-full object-cover" /> : userConfig.avatar}</div><div className={`absolute -bottom-1 -right-1 w-9 h-9 bg-${themeColor}-500 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg`}><Camera size={16} /></div>{userConfig.subscriptionTier === 'premium' && <div className={`absolute -top-3 -left-3 w-10 h-10 bg-yellow-400 text-white rounded-full flex items-center justify-center border-4 border-white animate-bounce`}><Crown size={20} fill="white" /></div>}</div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">{userConfig.name}</h2><p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t.memberSince} {stats.streak} {t.dayUnit}</p>
            </div>

            <div className={`bg-gradient-to-br from-indigo-700 via-${themeColor}-500 to-purple-700 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden group`}>
              <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-700"><Crown size={120} /></div>
              <div className="flex items-center justify-between mb-6 relative z-10"><div className="space-y-1"><h3 className="text-base font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={18} className="text-yellow-300 fill-yellow-300" /> {t.premiumTitle}</h3><div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border border-white/30 bg-white/10 w-fit`}>{t[`${userConfig.subscriptionTier}Tier` as keyof typeof t]}</div></div><div className="bg-black/20 px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2"><Coins size={14} className="text-yellow-300 fill-yellow-300" /><span className="font-black text-sm">{userConfig.points || 0}</span></div></div>
              <div className="space-y-6 relative z-10"><p className="text-[11px] font-medium opacity-90 leading-relaxed italic">{t.premiumDesc}</p><div className="flex gap-3"><button onClick={() => setShowTierDetails(true)} className="flex-1 py-4 bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20"><Info size={14} /> {t.viewPlans}</button><button onClick={handleMetaMaskRecharge} disabled={isRecharging} className="flex-1 py-4 bg-white text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">{isRecharging ? <Loader2 className="animate-spin" size={14} /> : <><Wallet size={14} /> {t.recharge}</>}</button></div></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setShowCalendarOverlay(true)} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center active:scale-95 transition-all"><span className={`text-2xl font-black text-${themeColor}-600 mb-1`}>{stats.entryCount}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.entries}</span></button>
               <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"><span className="text-2xl font-black text-rose-500 mb-1">{stats.streak}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.days}</span></div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-7 shadow-xl border-2 border-gray-50 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-0.5"><h3 className="font-black text-sm uppercase tracking-widest text-gray-800">{t.fanSquad}</h3><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{fans.length} / 5 {t.entries}</p></div>
                <button onClick={handleTryAddFan} className={`w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-sm hover:bg-indigo-100`}><Plus size={24} /></button>
              </div>
              <div className="space-y-4">
                {fans.map(fan => (
                  <div key={fan.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl group animate-in slide-in-from-bottom-2 border border-transparent transition-all"><div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl overflow-hidden shadow-sm">{fan.avatar.startsWith('data:image') ? <img src={fan.avatar} className="w-full h-full object-cover" /> : fan.avatar}</div><div className="flex-1 min-w-0"><p className="font-black text-gray-800 truncate">{fan.name}</p><p className={`text-[10px] font-black uppercase tracking-widest text-${themeColor}-400`}>{t[`style${fan.style.charAt(0).toUpperCase() + fan.style.slice(1)}` as keyof typeof t]}</p></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => setEditingFan(fan)} className="p-2 text-indigo-400 active:scale-90"><Edit2 size={18} /></button><button onClick={() => setFans(fans.filter(f => f.id !== fan.id))} className="p-2 text-rose-400 active:scale-90"><Trash2 size={18} /></button></div></div>
                ))}
                {fans.length === 0 && <div className="text-center py-10 px-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100"><Users size={32} className="mx-auto text-gray-200 mb-3" /><p className="text-xs text-gray-400 font-bold leading-relaxed">{t.premiumDesc}</p></div>}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-white/80 backdrop-blur-2xl border-2 border-${themeColor}-50 rounded-[2.5rem] px-6 py-2 flex items-center justify-between z-40 shadow-2xl`}>
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? `text-${themeColor}-600 scale-110` : 'text-gray-300'}`}><Home size={22} fill={activeTab === 'feed' ? 'currentColor' : 'none'}/><span className="text-[8px] font-black uppercase tracking-widest">{t.home}</span></button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? `text-${themeColor}-600 scale-110` : 'text-gray-300'}`}><BarChart2 size={22}/><span className="text-[8px] font-black uppercase tracking-widest">{t.insights}</span></button>
        <button onClick={() => setActiveTab('dilemma')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dilemma' ? `text-${themeColor}-600 scale-110` : 'text-gray-300'}`}><Dice5 size={22} fill={activeTab === 'dilemma' ? 'currentColor' : 'none'}/><span className="text-[8px] font-black uppercase tracking-widest">{t.dilemma}</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? `text-${themeColor}-600 scale-110` : 'text-gray-300'}`}><User size={22} fill={activeTab === 'profile' ? 'currentColor' : 'none'}/><span className="text-[8px] font-black uppercase tracking-widest">{t.profile}</span></button>
      </nav>

      {/* Success Animation Overlay (Jumps Back Feedback) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
            <div className={`w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2`}>
              <CheckCircle size={40} className="animate-in zoom-in duration-700" />
            </div>
            <h3 className="text-2xl font-black text-gray-800">{showSuccessOverlay.type === 'recharge' ? t.pointsRechargeSuccess : t.update}</h3>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest animate-pulse">Returning to you...</p>
          </div>
        </div>
      )}

      {/* Calendar Overlay */}
      {showCalendarOverlay && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-black text-gray-800">{t.calendarTitle}</h3><button onClick={() => setShowCalendarOverlay(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button></div>
            <div className="flex items-center justify-between mb-6 px-2"><button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft size={20}/></button><span className="font-black text-gray-700">{calendarViewMonth.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}</span><button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronRight size={20}/></button></div>
            <div className="grid grid-cols-7 gap-2">
              {(lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map(d => (<div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{d}</div>))}
              {calendarDays.map((day, i) => {
                const key = day ? `${calendarViewMonth.getFullYear()}-${calendarViewMonth.getMonth()}-${day}` : '';
                const hasEntry = entriesByDateMap[key];
                return (
                  <div key={i} className="aspect-square flex items-center justify-center relative">{day && (<div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${hasEntry ? `bg-${themeColor}-500 text-white shadow-lg` : 'text-gray-400 bg-gray-50/50'}`}>{day}</div>)}</div>
                );
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-4"><div className={`w-3 h-3 rounded-full bg-${themeColor}-500`} /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.entries}</span></div>
          </div>
        </div>
      )}

      {showTierDetails && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative">
             <div className="flex items-center justify-between mb-8"><div className="flex items-center gap-3"><div className={`w-10 h-10 bg-${themeColor}-50 rounded-2xl flex items-center justify-center text-${themeColor}-600`}><Crown size={20} /></div><h3 className="text-xl font-black text-gray-800 tracking-tight">{t.tierDetails}</h3></div><button onClick={() => { setShowTierDetails(false); setLimitReason(null); }} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button></div>
             {limitReason && <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3"><AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} /><p className="text-xs text-amber-700 font-bold leading-relaxed">{limitReason}</p></div>}
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {(['free', 'basic', 'premium'] as SubscriptionTier[]).map(tier => {
                  let cost = tier === 'free' ? 0 : tier === 'basic' ? 50 : 69;
                  return (
                    <button key={tier} onClick={() => handleTierSelect(tier)} className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group ${userConfig.subscriptionTier === tier ? `border-${themeColor}-500 bg-${themeColor}-50/30 shadow-xl` : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'}`}><div className="text-left space-y-1"><p className={`font-black text-xs uppercase tracking-widest flex items-center gap-2 ${userConfig.subscriptionTier === tier ? `text-${themeColor}-600` : 'text-gray-600'}`}>{t[`${tier}Tier` as keyof typeof t]}{userConfig.subscriptionTier === tier && <span className={`text-[8px] px-2 py-0.5 rounded-lg bg-${themeColor}-600 text-white font-black`}>{t.currentPlan}</span>}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t[`${tier}LimitDesc` as keyof typeof t]}</p><p className={`text-[9px] font-black uppercase mt-1 ${userConfig.subscriptionTier === tier ? 'opacity-40' : `text-${themeColor}-400`}`}>{tier === 'free' ? t.freeCost : t.costPointsValue.replace('{n}', cost.toString())}</p></div><div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${userConfig.subscriptionTier === tier ? `bg-${themeColor}-600 text-white shadow-lg` : 'bg-white text-gray-200 group-hover:text-gray-400'}`}>{userConfig.subscriptionTier === tier ? <Check size={18} /> : <Plus size={18} />}</div></button>
                  );
                })}
             </div>
             <div className="mt-8 pt-6 border-t border-gray-100"><button onClick={handleMetaMaskRecharge} className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-${themeColor}-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3`}><Wallet size={16} /> {t.recharge}</button></div>
           </div>
        </div>
      )}
      
      {showInsufficientPoints !== null && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[2.5rem] w-full max-sm shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden text-center"><div className={`w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-lg`}><AlertCircle size={40} /></div><h3 className="text-xl font-black text-gray-800 mb-2">{t.insufficientPoints}</h3><p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 px-4">{t.insufficientPointsDetail.replace('{cost}', showInsufficientPoints.toString()).replace('{current}', userConfig.points.toString())}</p><div className="flex flex-col gap-3"><button onClick={handleMetaMaskRecharge} className={`w-full py-4 bg-${themeColor}-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2`}>{isRecharging ? <Loader2 className="animate-spin" size={16} /> : <><Wallet size={16} /> {t.goRecharge}</>}</button><button onClick={() => setShowInsufficientPoints(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">{t.cancel}</button></div></div>
        </div>
      )}

      {activeDeepChatEntry && <DeepChat entry={activeDeepChatEntry} userConfig={userConfig} fanId={activeDeepChat?.fanId} onClose={() => setActiveDeepChat(null)} onUpdateEntry={(u) => setEntries(entries.map(e => e.id === u.id ? u : e))} lang={lang} aiConfig={aiConfig} themeColor={themeColor} />}
      
      {showProfileEdit && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500">
             <h3 className="text-xl font-black mb-6 text-gray-800 tracking-tight">{t.userSettings}</h3>
             <div className="space-y-4">
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.userName}</p><input type="text" value={editName} onChange={(e)=>setEditName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none font-bold" /></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.userAvatar}</p><div className="flex items-center gap-4"><div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl overflow-hidden border-2 border-gray-100">{userConfig.avatar.startsWith('data:image') ? <img src={userConfig.avatar} className="w-full h-full object-cover" /> : userConfig.avatar}</div><label className={`flex-1 flex items-center justify-center gap-2 p-4 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer active:scale-95`}><ImageIcon size={16} /> {t.uploadAvatar}<input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) processImageUpload(f, (base64) => setUserConfig(prev => ({ ...prev, avatar: base64 })), 400); }}/></label></div></div>
             </div>
             <div className="flex gap-3 mt-8"><button onClick={()=>setShowProfileEdit(false)} className="flex-1 p-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest">CANCEL</button><button onClick={() => { setUserConfig(prev => ({ ...prev, name: editName })); setShowProfileEdit(false); }} className={`flex-1 p-4 bg-${themeColor}-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95`}>{t.save}</button></div>
           </div>
        </div>
      )}

      {showAddFanModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
             <h3 className="text-xl font-black mb-6 text-gray-800 tracking-tight">{t.addFan}</h3>
             <div className="space-y-4">
               <div className="flex flex-col items-center gap-4 mb-2"><div className={`w-24 h-24 rounded-[2rem] bg-gray-50 border-4 border-white shadow-xl flex items-center justify-center text-4xl overflow-hidden relative shadow-indigo-100`}>{newFan.avatar.startsWith('data:image') ? <img src={newFan.avatar} className="w-full h-full object-cover" /> : newFan.avatar}</div><label className={`flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer active:scale-95`}><Upload size={14} /> {t.uploadAvatar}<input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) processImageUpload(f, (base64) => setNewFan(prev => ({ ...prev, avatar: base64 })), 400); }} /></label></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fanName}</p><input type="text" value={newFan.name} onChange={(e)=>setNewFan({...newFan, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none font-bold" placeholder="Friend's Name" /></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.fanStyle}</p><div className="grid grid-cols-2 gap-2">{(['humorous', 'warm', 'cute', 'cool'] as AiStyle[]).map(style => (<button key={style} onClick={() => setNewFan({...newFan, style})} className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newFan.style === style ? `bg-indigo-600 text-white` : 'bg-gray-50 text-gray-400'}`}>{t[`style${style.charAt(0).toUpperCase() + style.slice(1)}` as keyof typeof t]}</button>))}</div></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t.selectFanAvatar}</p><div className="flex flex-wrap gap-2">{['✨', '🔥', '🌊', '🌿', '🦾', '🐶', '😺', '🐰'].map(emoji => (<button key={emoji} onClick={() => setNewFan({...newFan, avatar: emoji})} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newFan.avatar === emoji ? 'bg-indigo-100 scale-110 shadow-sm' : 'bg-gray-50'}`}>{emoji}</button>))}</div></div>
             </div>
             <div className="flex gap-3 mt-8"><button onClick={()=>setShowAddFanModal(false)} className="flex-1 p-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest">CANCEL</button><button onClick={handleAddFan} className={`flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2`}><Coins size={14} /> {t.costPoints}</button></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
async function generateAiComment(
  content: string,
  mood: string,
  lang: string,
  userName: string,
  image?: string,
  fans?: number
): Promise<string> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        mood,
        lang,
        userName,
        image,
        fans,
      }),
    });

    if (!res.ok) {
      throw new Error("AI 请求失败");
    }

    const data = await res.json();
    return data.text || "AI 暂时没有回复";
  } catch (e) {
    console.error(e);
    return "AI 回复暂时不可用";
  }
}

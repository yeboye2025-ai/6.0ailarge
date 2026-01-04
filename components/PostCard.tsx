
import React, { useState } from 'react';
import { DiaryEntry, AiConfig, UserConfig, AiComment, AiStyle } from '../types';
import { MessageCircle, Shield, Globe, Users, Heart, Play, Pause } from 'lucide-react';
import { locales, Language } from '../locales';

interface PostCardProps {
  entry: DiaryEntry;
  onOpenChat: (entryId: string, fanId?: string) => void;
  lang: Language;
  aiConfig: AiConfig;
  userConfig: UserConfig;
  themeColor: string;
}

const STYLE_THEMES: Record<AiStyle, { bg: string, border: string, text: string, name: string }> = {
  warm: {
    bg: 'from-pink-50/80 to-purple-50/80',
    border: 'border-pink-100',
    text: 'text-pink-600',
    name: 'text-pink-700'
  },
  humorous: {
    bg: 'from-amber-50/80 to-orange-50/80',
    border: 'border-amber-100',
    text: 'text-amber-600',
    name: 'text-amber-700'
  },
  cute: {
    bg: 'from-sky-50/80 to-blue-50/80',
    border: 'border-sky-100',
    text: 'text-sky-600',
    name: 'text-sky-700'
  },
  cool: {
    bg: 'from-indigo-50/80 to-slate-100/80',
    border: 'border-indigo-100',
    text: 'text-indigo-600',
    name: 'text-indigo-700'
  }
};

export const PostCard: React.FC<PostCardProps> = ({ entry, onOpenChat, lang, aiConfig, userConfig, themeColor }) => {
  const t = locales[lang];
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const isUserAvatarImage = userConfig.avatar.startsWith('data:image');
  
  const privacyIcon = () => {
    switch (entry.privacy) {
      case 'private': return <Shield size={12} className={`text-${themeColor}-300`} />;
      case 'friends': return <Users size={12} className={`text-${themeColor}-300`} />;
      case 'anonymous': return <Globe size={12} className={`text-${themeColor}-300`} />;
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleLike = (idx: number) => {
    setCommentLikes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderFanAvatar = (avatar: string) => {
    if (avatar.startsWith('data:image')) {
      return <img src={avatar} className="w-full h-full object-cover" alt="fan avatar" />;
    }
    return <span className="text-sm">{avatar}</span>;
  };

  // Formatted full timestamp: YYYY/MM/DD HH:mm
  const fullTimestamp = new Date(entry.timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className={`bg-white border-2 border-${themeColor}-50 rounded-[2.5rem] p-5 shadow-sm active:scale-[0.98] transition-all mb-6 relative overflow-hidden`}>
      <div className={`absolute -top-4 -right-4 w-16 h-16 bg-${themeColor}-50 rounded-full opacity-50`} />
      
      <div className="flex items-start gap-4 mb-4 relative">
        <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-${themeColor}-100 to-purple-100 flex items-center justify-center text-2xl shadow-inner border-2 border-white overflow-hidden`}>
          {isUserAvatarImage ? (
            <img src={userConfig.avatar} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            userConfig.avatar
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-gray-800 text-sm">{userConfig.name}</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-${themeColor}-50 rounded-full`}>
                <span className="text-xs">{entry.mood}</span>
                {privacyIcon()}
              </div>
            </div>
            {/* Subtle Full Timestamp */}
            <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">
              {fullTimestamp}
            </span>
          </div>
          <p className="text-gray-600 mt-2 leading-relaxed text-[15px] font-medium break-words">
            {entry.content}
          </p>

          {entry.imageUrl && (
            <div className={`mt-3 rounded-2xl overflow-hidden border-2 border-${themeColor}-50 bg-gray-50 flex items-center justify-center`}>
              <img 
                src={entry.imageUrl} 
                alt="mood attachment" 
                className="max-w-full h-auto max-h-[500px] object-contain block mx-auto" 
              />
            </div>
          )}

          {entry.voiceData && (
            <div className="mt-3">
              <audio 
                ref={audioRef} 
                src={entry.voiceData} 
                onPlay={() => setIsPlaying(true)} 
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
              />
              <button 
                onClick={toggleAudio}
                className={`flex items-center gap-3 px-4 py-2 bg-${themeColor}-50 rounded-2xl text-${themeColor}-500 border border-${themeColor}-100 active:scale-95 transition-all w-full max-w-[200px]`}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                <div className={`flex-1 h-1 bg-${themeColor}-200 rounded-full overflow-hidden`}>
                   <div className={`h-full bg-${themeColor}-500 transition-all ${isPlaying ? 'w-full duration-[30s]' : 'w-0'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{t.voiceNote}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {entry.aiComments?.map((comment, idx) => {
          const st = STYLE_THEMES[comment.style || 'warm'];
          const isLiked = commentLikes[idx];
          return (
            <div key={idx} className={`bg-gradient-to-r ${st.bg} rounded-[1.5rem] p-4 border ${st.border} ml-2 relative group`}>
              <div className={`absolute -left-1 top-4 w-2 h-2 rotate-45 border-l border-b ${st.bg.split(' ')[0]} ${st.border}`} 
                   style={{ backgroundColor: 'inherit' }} />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-sm shadow-sm border border-gray-100 overflow-hidden">
                  {renderFanAvatar(comment.fanAvatar)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${st.name}`}>{comment.fanName}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 italic font-medium leading-snug">
                "{comment.content}"
              </p>
              <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onOpenChat(entry.id, comment.fanId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-white text-[10px] font-black ${st.text} rounded-full border ${st.border} shadow-sm active:scale-95 transition-all hover:bg-opacity-90`}
                >
                  <MessageCircle size={12} />
                  {t.deepenConversation}
                </button>
                <button 
                  onClick={() => toggleLike(idx)}
                  className={`p-2 transition-all active:scale-125 ${isLiked ? 'text-rose-500' : `${st.text} opacity-40 hover:opacity-100`}`}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

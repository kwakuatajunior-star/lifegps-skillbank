"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  // --- STATE ---
  const [videos, setVideos] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [showHeart, setShowHeart] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [trainingGoal, setTrainingGoal] = useState(60); 
  const [goalReached, setGoalReached] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

  // --- AI TITLE ENGINE ---
  const generateSkillTitle = (filename: string) => {
    const name = filename.toLowerCase();
    if (name.includes('code') || name.includes('js')) return "Software Architecture Protocol";
    if (name.includes('gym') || name.includes('fit')) return "Physical Peak Conditioning";
    if (name.includes('trade') || name.includes('money')) return "Capital Growth Strategy";
    // If it's just a number or random string, give it a "Mastery" title
    return `Mastery Session #${filename.slice(0, 4)}`;
  };

  // --- LOGIC ---
  useEffect(() => {
    const savedStreak = localStorage.getItem('skillStreak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleGoalCompletion = () => {
    playVictorySound();
    setGoalReached(true);
    triggerConfetti();
  };

  const playVictorySound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) setVideos(data);
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds(prev => {
        const next = prev + 1;
        if (next === trainingGoal) handleGoalCompletion();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [trainingGoal]);

  // --- CALCULATIONS ---
  const videoCount = (videos as any[])?.length || 0;
  const userLevel = Math.floor(videoCount / 3) + 1;
  const filteredVideos = (videos as any[]).filter((v) => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className={`h-screen w-full overflow-y-scroll snap-y snap-mandatory relative scrollbar-hide transition-colors duration-700 ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-black'}`}>
      
      {/* CONFETTI */}
      {showConfetti && (
        <div className="fixed inset-0 z-[300] pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full animate-confetti" style={{left: `${Math.random() * 100}%`, top: `-5%`, backgroundColor: ['#EAB308', '#3B82F6', '#EF4444', '#10B981'][Math.floor(Math.random() * 4)], animationDelay: `${Math.random() * 2}s`, animationDuration: `2s` }} />
          ))}
          <style jsx>{` @keyframes confetti { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } } .animate-confetti { animation: confetti 2s linear forwards; } `}</style>
        </div>
      )}

      {/* NAVIGATION */}
      <div className="fixed top-6 left-0 right-0 z-[100] flex flex-col gap-4 px-6 pointer-events-none">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col pointer-events-auto">
            <h1 className="font-black text-2xl italic uppercase tracking-tighter">LifeGPS</h1>
            <div className="mt-1 flex gap-2">
              <div className="bg-orange-500 px-2 py-0.5 rounded text-white text-[10px] font-black italic">⚡ {streak}D</div>
              <div className="bg-blue-600 px-2 py-0.5 rounded text-white text-[10px] font-black uppercase shadow-lg">LVL {userLevel}</div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-black tabular-nums border ${isDarkMode ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-green-100 border-green-400 text-green-700'}`}>
                {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 items-center pointer-events-auto">
            <button onClick={() => setViewMode(viewMode === 'feed' ? 'grid' : 'feed')} className="p-2 rounded-xl border bg-white/10">{viewMode === 'feed' ? '📱' : '🖼️'}</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl">{isDarkMode ? '🌙' : '☀️'}</button>
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="pt-32 pb-10 px-4 min-h-screen grid grid-cols-3 gap-2">
          {filteredVideos.map((video, i) => (
            <div key={i} onClick={() => setViewMode('feed')} className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative group cursor-pointer">
              <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
                <p className="text-[7px] font-black uppercase text-blue-400 leading-tight">{generateSkillTitle(video.name)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FEED VIEW */
        filteredVideos.map((video, index) => (
          <section key={index} className="h-screen w-full snap-start flex flex-col items-center justify-center relative bg-black">
            <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="h-full w-full object-contain" autoPlay loop muted playsInline />
            
            <div className="absolute bottom-10 left-5 z-[60] max-w-[85%] p-6 rounded-3xl backdrop-blur-2xl border border-white/10 bg-black/40 text-white shadow-2xl">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">SkillBank Active</p>
                <h2 className="text-xl font-black italic uppercase mb-2 leading-none">
                  {generateSkillTitle(video.name)}
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-xs font-bold opacity-70">@future_billionaire ✅</p>
                </div>
            </div>

            {/* SIDEBAR */}
            <div className="absolute right-4 bottom-24 z-[90] flex flex-col gap-6 items-center">
               <button onClick={() => setOpenComments(openComments === index ? null : index)} className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-2xl shadow-xl">💬</button>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
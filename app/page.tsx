"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSheet, setShowSheet] = useState<string | null>(null); // For Bottom Sheet
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

  // --- FETCH & TIMER ---
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) setVideos(data);
    };
    fetchVideos();
    const savedStreak = localStorage.getItem('skillStreak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const playSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.play().catch(() => console.log("Sound ready for next goal!"));
  };

  const deleteVideo = async (filename: string) => {
    const { error } = await supabase.storage.from('videos').remove([filename]);
    if (!error) window.location.reload();
  };

  const shareVideo = (name: string) => {
    const text = `Watching my growth on LifeGPS! Streak: ${streak} days. Skill: ${name}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const videoCount = videos.length;
  const userLevel = Math.floor(videoCount / 3) + 1;

  return (
    <main className={`h-screen w-full overflow-hidden relative ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-black'}`}>
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-black text-2xl italic tracking-tighter text-white">LifeGPS</h1>
          <div className="flex gap-2 mt-1">
             <div className="bg-orange-500 px-2 py-0.5 rounded text-[10px] font-black text-white italic shadow-lg">⚡ {streak}D</div>
             <div className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">LVL {userLevel}</div>
          </div>
        </div>
        <div className="flex gap-3 pointer-events-auto">
          <button onClick={() => setViewMode(viewMode === 'feed' ? 'grid' : 'feed')} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">{viewMode === 'feed' ? '🖼️' : '📱'}</button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">{isDarkMode ? '🌙' : '☀️'}</button>
        </div>
      </div>

      {/* FEED (FULL SCREEN FOCUS) */}
      <div className={`h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide ${viewMode === 'grid' ? 'hidden' : 'block'}`}>
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black">
            {/* VIDEO BOX - OBJECT COVER FIXES THE ALIGNMENT */}
            <video 
              src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`}
              className="w-full h-full object-cover" // This makes it full screen!
              autoPlay loop muted playsInline
            />

            {/* SIDEBAR BUTTONS */}
            <div className="absolute right-4 bottom-32 z-50 flex flex-col gap-6 items-center">
              <button className="flex flex-col items-center gap-1 group">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 group-active:scale-90 transition-all">👤➕</div>
              </button>
              
              <button onClick={() => setLikedVideos(prev => [...prev, video.name])} className="flex flex-col items-center gap-1">
                <div className={`p-4 rounded-full backdrop-blur-md border border-white/20 transition-all ${likedVideos.includes(video.name) ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>❤️</div>
              </button>

              <button onClick={() => setShowSheet(video.name)} className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20">
                <span className="text-xl font-bold">...</span>
              </button>
              
              <button onClick={() => shareVideo(video.name)} className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20">🔁</button>
            </div>

            {/* BOTTOM INFO */}
            <div className="absolute bottom-10 left-6 z-50 max-w-[70%]">
              <h2 className="text-white font-black text-xl italic mb-2">@future_billionaire ✅</h2>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <p className="text-blue-400 text-[10px] font-black uppercase mb-1">Skill Mission</p>
                <p className="text-white text-sm font-bold truncate">{video.name.replace('.mp4', '')}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* GRID VIEW PORTFOLIO */}
      {viewMode === 'grid' && (
        <div className="pt-32 p-4 grid grid-cols-3 gap-2 h-screen overflow-y-scroll scrollbar-hide">
          {videos.map((v, i) => (
            <div key={i} onClick={() => setViewMode('feed')} className="aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden border border-white/5">
              <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${v.name}`} className="w-full h-full object-cover opacity-50" />
            </div>
          ))}
        </div>
      )}

      {/* ACTION SHEET (BOTTOM SHEET) */}
      {showSheet && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full bg-zinc-900 rounded-t-[32px] p-8 border-t border-white/10 animate-in slide-in-from-bottom-full duration-500">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-8" />
              <button onClick={() => shareVideo(showSheet)} className="w-full py-4 text-left font-bold text-lg border-b border-white/5 flex items-center gap-4">🚀 Share to WhatsApp</button>
              <button onClick={() => deleteVideo(showSheet)} className="w-full py-4 text-left font-bold text-lg text-red-500 border-b border-white/5 flex items-center gap-4">🗑️ Delete Skill Loop</button>
              <button onClick={() => setShowSheet(null)} className="w-full py-6 mt-4 bg-zinc-800 rounded-2xl font-black uppercase tracking-widest text-sm text-center">Cancel</button>
           </div>
        </div>
      )}

    </main>
  );
}
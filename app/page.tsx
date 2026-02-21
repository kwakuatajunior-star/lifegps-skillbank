"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSheet, setShowSheet] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Control video sound

  // --- AUDIO LOGIC ---
  const playVictorySound = () => {
    if (!audioEnabled) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const unlockAudio = () => {
    setAudioEnabled(true);
    setIsMuted(false); // Unmute the videos too!
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  };

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
      setTotalSeconds(prev => {
        const next = prev + 1;
        if (next % 60 === 0) playVictorySound();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  return (
    <main className={`h-screen w-full overflow-hidden relative ${isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-black'}`}>
      
      {/* 🔊 START BUTTON (Unlocks Video & App Sound) */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10 text-center">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.5)]">
               <span className="text-4xl text-white">🔊</span>
            </div>
            <h2 className="text-white text-2xl font-black uppercase italic mb-2">Sound Restricted</h2>
            <p className="text-white/50 mb-8 text-xs uppercase font-bold tracking-[0.2em]">Tap to enable video & victory audio</p>
            <button 
              onClick={unlockAudio}
              className="bg-white text-black px-12 py-4 rounded-full font-black uppercase text-sm tracking-tighter hover:scale-105 transition-all"
            >
              Enter LifeGPS
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-black text-2xl italic text-white tracking-tighter">LifeGPS</h1>
          <div className="bg-orange-500 w-fit px-2 py-0.5 rounded mt-1 text-[10px] font-black text-white italic shadow-lg">⚡ {streak}D STREAK</div>
        </div>
        <div className="flex gap-3 pointer-events-auto">
           <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 text-xl">
             {isMuted ? '🔇' : '🔊'}
           </button>
        </div>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
            <video 
              src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`}
              className="w-full h-full object-cover"
              autoPlay 
              loop 
              playsInline
              muted={isMuted} // Controlled by the button!
            />

            {/* SIDEBAR */}
            <div className="absolute right-4 bottom-32 z-50 flex flex-col gap-6 items-center">
              <div className="w-12 h-12 bg-white rounded-full overflow-hidden border-2 border-white mb-2">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Billionaire" alt="avatar" />
              </div>
              <button onClick={() => setLikedVideos(prev => [...prev, video.name])} className={`p-4 rounded-full backdrop-blur-md border border-white/20 text-xl ${likedVideos.includes(video.name) ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>❤️</button>
              <button onClick={() => setShowSheet(video.name)} className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 text-xl font-black">...</button>
              <button className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 text-xl">🔁</button>
            </div>

            {/* BOTTOM INFO */}
            <div className="absolute bottom-10 left-6 z-50 max-w-[70%] drop-shadow-lg">
              <h2 className="text-white font-black text-xl italic mb-1">@future_billionaire ✅</h2>
              <p className="text-white/80 text-sm font-bold mb-3">{video.name.split('_')[1] || video.name}</p>
              <div className="flex gap-2">
                <div className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase italic">Mastery Rank</div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase italic">Session: {Math.floor(totalSeconds / 60)}m</div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* BOTTOM SHEET */}
      {showSheet && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowSheet(null)}>
           <div className="w-full bg-zinc-900 rounded-t-[32px] p-8 pb-12 border-t border-white/10 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-8" />
              <button onClick={() => window.location.reload()} className="w-full py-4 text-left font-bold text-lg border-b border-white/5 flex items-center gap-4 text-white">🚀 Share Mastery</button>
              <button onClick={async () => {
                await supabase.storage.from('videos').remove([showSheet]);
                window.location.reload();
              }} className="w-full py-4 text-left font-bold text-lg text-red-500 flex items-center gap-4">🗑️ Delete Skill Loop</button>
           </div>
        </div>
      )}
    </main>
  );
}
"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // --- 1. THE LEVEL CALCULATOR ---
  const videoCount = videos.length;
  const getRank = () => {
    if (videoCount === 0) return "Starting Journey";
    if (videoCount < 3) return "Novice";
    if (videoCount < 10) return "Executive";
    return "Legendary Billionaire";
  };

  const handleUpload = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file);
      if (uploadError) throw uploadError;
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.muted = isMuted;
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
          video.muted = true;
        }
      });
    }, { threshold: 0.7 });
    videoRefs.current.forEach((v) => { if (v) observer.observe(v); });
    return () => observer.disconnect();
  }, [videos, isMuted]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) setVideos(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    };
    fetchVideos();
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black font-sans">
      
      {!audioEnabled && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-8">
          <button onClick={() => { setAudioEnabled(true); setIsMuted(false); }} className="bg-blue-600 text-white w-full py-6 rounded-[32px] font-black uppercase tracking-widest shadow-[0_0_40px_rgba(37,99,235,0.6)]">
            Open LifeGPS 🛰️
          </button>
        </div>
      )}

      {/* --- NEW MASTERY DASHBOARD HEADER --- */}
      <div className="absolute top-0 w-full z-50 p-6 flex flex-col gap-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-black text-2xl italic tracking-tighter">LifeGPS</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded text-white uppercase italic">Rank: {getRank()}</span>
              <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{videoCount} Skills Logged</span>
            </div>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-lg">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${Math.min((videoCount / 10) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={video.name || i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video 
              ref={(el) => { videoRefs.current[i] = el; }}
              src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`}
              className="w-full h-full object-cover"
              loop playsInline muted={true}
            />
            
            <div className="absolute right-6 bottom-40 z-50 flex flex-col gap-8 items-center">
              <button onClick={() => setLikedVideos(prev => [...prev, video.name])} className={`p-4 rounded-2xl backdrop-blur-xl border border-white/10 ${likedVideos.includes(video.name) ? 'bg-red-500' : 'bg-white/5'}`}>
                <span className="text-2xl">❤️</span>
              </button>
            </div>

            <div className="absolute bottom-28 left-6 right-24 z-50">
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px]">
                  <p className="text-white font-black italic text-lg uppercase tracking-tight mb-1">@future_billionaire</p>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Mastery ID: {i + 1}</p>
               </div>
            </div>
          </section>
        ))}
      </div>

      {/* UPLOAD BUTTON */}
      <div className="absolute bottom-0 w-full z-[100] p-6 pb-10 flex justify-center items-center">
        <label className="cursor-pointer w-full max-w-md">
          <div className="bg-white text-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
            <span className="font-black uppercase tracking-widest text-sm">
              {uploading ? "Analyzing Skill..." : "Log New Mastery"}
            </span>
            <span className="text-xl">+</span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
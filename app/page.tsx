"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videoCount = videos.length;
  
  // --- AI COACH LOGIC ---
  const getCoachAdvice = () => {
    if (videoCount === 0) return "The first step is the hardest. Upload your first mastery clip now.";
    if (videoCount < 5) return "Consistency is the currency of billionaires. Keep stacking these loops.";
    if (videoCount < 10) return "You're entering the Executive Phase. Focus on the quality of your form.";
    return "Legendary status confirmed. You are now the top 1% of LifeGPS users.";
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
    <main className="h-screen w-full overflow-hidden relative bg-black font-sans text-white">
      
      {!audioEnabled && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-3xl font-black italic mb-2">LifeGPS</h2>
            <p className="text-blue-500 text-[10px] tracking-[0.4em] uppercase mb-12">Initializing Mastery</p>
            <button onClick={() => { setAudioEnabled(true); setIsMuted(false); }} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_50px_white]">
              Begin Session
            </button>
          </div>
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <div className="absolute top-0 w-full z-50 p-6 bg-gradient-to-b from-black to-transparent">
        <div className="flex justify-between items-center mb-4">
          <div onClick={() => setShowVision(true)} className="cursor-pointer">
            <h1 className="font-black text-2xl italic tracking-tighter">LifeGPS</h1>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">Mastery Level {videoCount}</p>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        
        {/* AI COACH CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs">🤖</div>
          <p className="text-[10px] font-medium leading-tight text-white/80">{getCoachAdvice()}</p>
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
              <div className="p-4 rounded-2xl backdrop-blur-xl border border-white/10 bg-white/5">
                <span className="text-2xl">🏆</span>
              </div>
            </div>

            <div className="absolute bottom-28 left-6 right-24 z-50">
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px]">
                  <p className="text-white font-black italic text-lg uppercase tracking-tight mb-1">Session {videoCount - i}</p>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Identity Confirmed: Future Billionaire</p>
               </div>
            </div>
          </section>
        ))}
      </div>

      {/* VISION MODAL */}
      {showVision && (
        <div className="fixed inset-0 z-[700] bg-blue-600/90 backdrop-blur-2xl flex items-center justify-center p-10" onClick={() => setShowVision(false)}>
          <div className="text-center">
            <p className="text-white/60 text-xs font-black uppercase mb-4 tracking-[0.5em]">The Ultimate Goal</p>
            <h2 className="text-4xl font-black italic leading-none mb-8">BUILD A GLOBAL SKILL BANK 🌍</h2>
            <p className="text-white/80 text-sm italic">Tap anywhere to return</p>
          </div>
        </div>
      )}

      {/* LOG BUTTON */}
      <div className="absolute bottom-0 w-full z-[100] p-8 pb-12 flex justify-center items-center">
        <label className="cursor-pointer w-full">
          <div className="bg-white text-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
            <span className="font-black uppercase tracking-widest text-xs">
              {uploading ? "Analyzing..." : "Capture Mastery"}
            </span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
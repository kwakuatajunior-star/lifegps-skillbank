"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploading, setUploading] = useState(false); // Track upload state
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // --- 1. THE UPLOAD ENGINE ---
  const handleUpload = async (event: any) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      alert("Mastery Uploaded! Refreshing feed...");
      window.location.reload(); // Refresh to see the new video
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 2. VIDEO OBSERVER (SOUND SYNC) ---
  useEffect(() => {
    const observerOptions = { threshold: 0.7 };
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
    }, observerOptions);

    videoRefs.current.forEach((v) => { if (v) observer.observe(v); });
    return () => observer.disconnect();
  }, [videos, isMuted]);

  // --- 3. FETCH VIDEOS ---
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) setVideos(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    };
    fetchVideos();
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black font-sans">
      
      {/* 🔊 START OVERLAY */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-8">
          <button 
            onClick={() => { setAudioEnabled(true); setIsMuted(false); }} 
            className="bg-white text-black w-full py-6 rounded-[32px] font-black uppercase tracking-widest shadow-2xl scale-100 active:scale-95 transition-all"
          >
            Open LifeGPS 🛰️
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-0 w-full z-50 p-8 flex justify-between items-start">
        <h1 className="text-white font-black text-3xl italic tracking-tighter drop-shadow-2xl">LifeGPS</h1>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xl">
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video 
              ref={(el) => (videoRefs.current[i] = el)}
              src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`}
              className="w-full h-full object-cover"
              loop playsInline muted={true}
            />
            
            {/* SIDEBAR UI */}
            <div className="absolute right-6 bottom-40 z-50 flex flex-col gap-8 items-center">
              <button onClick={() => setLikedVideos(prev => [...prev, video.name])} className="flex flex-col items-center gap-1">
                <div className={`p-4 rounded-2xl backdrop-blur-xl border border-white/10 ${likedVideos.includes(video.name) ? 'bg-red-500' : 'bg-white/5'}`}>
                  <span className="text-2xl">❤️</span>
                </div>
              </button>
              <button className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                <span className="text-2xl font-black text-white/40">...</span>
              </button>
            </div>

            {/* INFO CARD */}
            <div className="absolute bottom-28 left-6 right-24 z-50">
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px]">
                  <p className="text-white font-black italic text-lg uppercase tracking-tight mb-1">@future_billionaire</p>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{video.name.slice(0, 15)}...</p>
               </div>
            </div>
          </section>
        ))}
      </div>

      {/* --- THE CREATOR TAB BAR --- */}
      <div className="absolute bottom-0 w-full z-[100] p-6 pb-10 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
        <label className="cursor-pointer group">
          <div className="bg-blue-600 px-10 py-4 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)] group-active:scale-90 transition-all">
            <span className="text-white font-black uppercase tracking-tighter">
              {uploading ? "Uploading..." : "Add Mastery"}
            </span>
            <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-bold">+</div>
          </div>
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading}
          />
        </label>
      </div>

    </main>
  );
}
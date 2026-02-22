"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // For the Delete Menu
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // --- AUTH ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (videoName: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this mastery loop?");
    if (!confirmDelete) return;

    const { error } = await supabase.storage.from('videos').remove([videoName]);
    if (error) alert(error.message);
    else window.location.reload();
  };

  // --- UPLOAD ---
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

  // --- FEED & SOUND ---
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) setVideos(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    };
    if (user) fetchVideos();
  }, [user]);

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

  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] text-center shadow-2xl">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-2 text-center">LifeGPS</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-center">Private Access Only</p>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm" />
            <button onClick={handleLogin} className="bg-white text-black py-5 rounded-2xl font-black uppercase text-sm mt-4 shadow-xl active:scale-95 transition-all">Unlock GPS</button>
            <button onClick={handleSignUp} className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">New Operator Signup</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black font-sans text-white">
      {/* HEADER */}
      <div className="absolute top-0 w-full z-50 p-6 flex justify-between items-start">
        <div>
          <h1 className="font-black text-2xl italic tracking-tighter drop-shadow-lg">LifeGPS</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">Operator: {user.email?.split('@')[0]}</p>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-lg">{isMuted ? '🔇' : '🔊'}</button>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            {/* SIDEBAR */}
            <div className="absolute right-6 bottom-40 z-50 flex flex-col gap-6 items-center">
              <button onClick={() => setActiveMenu(video.name)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl text-white font-black text-xl shadow-lg active:scale-90 transition-all">...</button>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xl">🔥</div>
            </div>

            {/* INFO */}
            <div className="absolute bottom-32 left-6 right-24 z-50">
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
                  <p className="text-white font-black italic text-lg uppercase tracking-tight mb-1">Session {videos.length - i}</p>
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{video.name.slice(0, 20)}</p>
               </div>
            </div>

            {/* ACTION SHEET (BOTTOM POPUP) */}
            {activeMenu === video.name && (
              <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end animate-in fade-in duration-300" onClick={() => setActiveMenu(null)}>
                <div className="w-full bg-zinc-900 p-10 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-10" />
                  <button onClick={() => handleDelete(video.name)} className="w-full py-5 text-left text-red-500 font-black uppercase tracking-widest text-sm flex items-center gap-4 border-b border-white/5">
                    🗑️ Delete Mastery
                  </button>
                  <button onClick={() => setActiveMenu(null)} className="w-full py-6 mt-6 bg-zinc-800 rounded-2xl font-black uppercase tracking-widest text-xs text-center text-white/60">Cancel</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* LOG BUTTON */}
      <div className="absolute bottom-0 w-full z-[80] p-8 pb-12 flex justify-center items-center pointer-events-none">
        <label className="cursor-pointer w-full max-w-sm pointer-events-auto">
          <div className="bg-blue-600 text-white py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all">
            <span className="font-black uppercase tracking-widest text-[11px]">
              {uploading ? "Processing..." : "Capture Mastery 🛰️"}
            </span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
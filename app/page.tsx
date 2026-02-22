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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
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
    if (error) alert("Access Requested. Check email or try logging in.");
  };

  // --- UPLOAD ---
  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("IDENTIFY SKILL: (e.g. TRADING, MUSIC, BOXING)");
      if (!skillName) return;

      setUploading(true);
      const cleanSkill = skillName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const fileName = `${cleanSkill}_${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file);
      if (uploadError) throw uploadError;
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- DELETE ---
  const handleDelete = async (videoName: string) => {
    if (!confirm("Wipe this record from the GPS?")) return;
    const { error } = await supabase.storage.from('videos').remove([videoName]);
    if (error) alert(error.message);
    else window.location.reload();
  };

  // --- FEED SYNC ---
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
    }, { threshold: 0.8 });
    videoRefs.current.forEach((v) => { if (v) observer.observe(v); });
    return () => observer.disconnect();
  }, [videos, isMuted]);

  if (!user) {
    return (
      <main className="h-screen w-full bg-zinc-950 flex items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-12 rounded-[50px] shadow-2xl">
          <div className="mb-12 text-center">
            <h1 className="text-white text-5xl font-black italic tracking-tighter mb-2">LifeGPS</h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.5em]">Command Center</p>
          </div>
          <div className="flex flex-col gap-5">
            <input type="email" placeholder="OPERATOR EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none focus:border-blue-500/50 transition-all text-xs font-bold" />
            <input type="password" placeholder="ACCESS CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none focus:border-blue-500/50 transition-all text-xs font-bold" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs mt-4 shadow-2xl active:scale-95 transition-all">Authenticate</button>
            <button onClick={handleSignUp} className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-4 hover:text-blue-500 transition-colors">Register New Device</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      {/* HUD HEADER */}
      <div className="absolute top-0 w-full z-50 p-8 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-black text-3xl italic tracking-tighter text-white drop-shadow-2xl">LifeGPS</h1>
          <div className="flex items-center gap-3 mt-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
             <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">Mastery Online</p>
          </div>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-black/20 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl pointer-events-auto shadow-2xl">
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* VIDEO ENGINE */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-900">
            {/* VIGNETTE OVERLAY */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
            
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            {/* SIDEBAR TOOLS */}
            <div className="absolute right-8 bottom-48 z-50 flex flex-col gap-8 items-center">
              <button onClick={() => setActiveMenu(video.name)} className="w-14 h-14 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-xl shadow-2xl active:scale-90 transition-all">...</button>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 text-lg shadow-inner italic font-black">S</div>
                <span className="text-[9px] font-black text-white/40 uppercase">{videos.length - i}</span>
              </div>
            </div>

            {/* IDENTITY CARD */}
            <div className="absolute bottom-16 left-8 right-28 z-50">
               <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 rounded-[45px] shadow-2xl">
                  <span className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full text-white uppercase tracking-widest mb-4 inline-block">Record Verified</span>
                  <h2 className="text-white font-black italic text-4xl uppercase tracking-tighter leading-none">
                    {video.name.split('_')[0]}
                  </h2>
               </div>
            </div>

            {/* ACTION MENU */}
            {activeMenu === video.name && (
              <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end" onClick={() => setActiveMenu(null)}>
                <div className="w-full bg-zinc-950 p-12 rounded-t-[60px] border-t border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-12" />
                  <button onClick={() => handleDelete(video.name)} className="w-full py-6 text-red-500 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 bg-red-500/5 rounded-3xl border border-red-500/10">
                    Wipe Record
                  </button>
                  <button onClick={() => setActiveMenu(null)} className="w-full py-6 mt-6 text-white/20 font-black uppercase text-[10px] tracking-widest">Close Command</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CAPTURE HUB */}
      <div className="absolute bottom-0 w-full z-[80] p-10 flex justify-center pointer-events-none">
        <label className="cursor-pointer w-full max-w-sm pointer-events-auto group">
          <div className="bg-white text-black py-6 rounded-[35px] flex items-center justify-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] group-active:scale-95 transition-all duration-300">
            <div className="w-2 h-2 bg-blue-600 rounded-full group-hover:animate-ping" />
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">
              {uploading ? "Analyzing Loop..." : "Capture Mastery"}
            </span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
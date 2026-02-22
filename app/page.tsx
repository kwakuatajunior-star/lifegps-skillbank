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
    if (error) alert(error.message);
  };

  // --- DELETE ---
  const handleDelete = async (videoName: string) => {
    if (!confirm("Delete this mastery loop?")) return;
    const { error } = await supabase.storage.from('videos').remove([videoName]);
    if (error) alert(error.message);
    else window.location.reload();
  };

  // --- UPLOAD WITH NAMING ---
  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // ASK FOR THE SKILL NAME
      const skillName = prompt("What skill are you mastering? (e.g. Coding, Fitness, Sales)");
      if (!skillName) return;

      setUploading(true);
      // We save the skill name directly into the file name so we can read it later!
      const cleanSkill = skillName.replace(/[^a-zA-Z0-9]/g, '_');
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

  // --- FEED ---
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
        <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] text-center">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-2">LifeGPS</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-center">Identity Verification</p>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none" />
            <button onClick={handleLogin} className="bg-white text-black py-5 rounded-2xl font-black uppercase text-sm mt-4">Enter Portal</button>
            <button onClick={handleSignUp} className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">Request Access</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      {/* HEADER */}
      <div className="absolute top-0 w-full z-50 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h1 className="font-black text-2xl italic tracking-tighter">LifeGPS</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest italic">{user.email?.split('@')[0]} Mastery Feed</p>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl">{isMuted ? '🔇' : '🔊'}</button>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            {/* SIDEBAR */}
            <div className="absolute right-6 bottom-40 z-50 flex flex-col gap-6">
              <button onClick={() => setActiveMenu(video.name)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl text-xl">...</button>
            </div>

            {/* INFO PANEL */}
            <div className="absolute bottom-32 left-6 right-24 z-50">
               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
                  {/* Extracting skill name from the file string */}
                  <h2 className="text-blue-500 font-black text-xs uppercase tracking-[0.3em] mb-1">Mastery Track</h2>
                  <p className="text-white font-black italic text-2xl uppercase tracking-tight">
                    {video.name.split('_')[0]}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                     <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-1/3 animate-pulse" />
                     </div>
                  </div>
               </div>
            </div>

            {/* ACTION SHEET */}
            {activeMenu === video.name && (
              <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setActiveMenu(null)}>
                <div className="w-full bg-zinc-900 p-10 rounded-t-[40px] border-t border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDelete(video.name)} className="w-full py-5 text-left text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-4 border-b border-white/5">
                    🗑️ Remove From GPS
                  </button>
                  <button onClick={() => setActiveMenu(null)} className="w-full py-5 mt-4 bg-white/5 rounded-2xl font-black uppercase text-[10px] text-white/40">Cancel</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* FOOTER UPLOAD */}
      <div className="absolute bottom-0 w-full z-[80] p-8 pb-12 flex justify-center items-center">
        <label className="cursor-pointer w-full max-w-sm">
          <div className="bg-blue-600 text-white py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all">
            <span className="font-black uppercase tracking-widest text-[11px]">
              {uploading ? "Analyzing Session..." : "Capture Mastery 🛰️"}
            </span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
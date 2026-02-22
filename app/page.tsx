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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // --- 1. AUTH LOGIC ---
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

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email or try logging in!");
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- 2. VIDEO FETCH & OBSERVER ---
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

  // --- LOGIN SCREEN UI ---
  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-8 font-sans">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-2 text-center">LifeGPS</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-center">Identity Verification</p>
          
          <div className="flex flex-col gap-4">
            <input 
              type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
            />
            <input 
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
            />
            <button onClick={handleLogin} className="bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm mt-4 active:scale-95 transition-all">Enter Portal</button>
            <button onClick={handleSignUp} className="text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">Request Access</button>
          </div>
        </div>
      </main>
    );
  }

  // --- MAIN APP UI ---
  return (
    <main className="h-screen w-full overflow-hidden relative bg-black font-sans text-white">
      {/* HEADER */}
      <div className="absolute top-0 w-full z-50 p-6 flex justify-between items-start">
        <div>
          <h1 className="font-black text-2xl italic tracking-tighter">LifeGPS</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">Logged in: {user.email?.split('@')[0]}</p>
        </div>
        <button onClick={handleLogout} className="bg-white/5 border border-white/10 p-3 rounded-xl text-[10px] font-black uppercase">Sign Out</button>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.map((video, i) => (
          <section key={i} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video 
              ref={(el) => { videoRefs.current[i] = el; }}
              src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`}
              className="w-full h-full object-cover"
              loop playsInline muted={isMuted}
            />
          </section>
        ))}
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-10 w-full flex justify-center p-6 z-50">
        <button className="bg-blue-600 w-full max-w-xs py-5 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.5)]">
           Log Mastery 🛰️
        </button>
      </div>
    </main>
  );
}
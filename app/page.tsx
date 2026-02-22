"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [view, setView] = useState('feed'); 
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // --- IDENTITY & AUTH ---
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

  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("IDENTIFY THE MISSION:");
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

  // --- DATA ENGINE ---
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from('videos').list();
      if (data) {
        const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setVideos(sorted);
        setFilteredVideos(sorted);
        const cats = sorted.map(v => v.name.split('_')[0]);
        setCategories(["ALL", ...Array.from(new Set(cats))]);
      }
    };
    if (user) fetchVideos();
  }, [user]);

  useEffect(() => {
    if (activeTab === "ALL") setFilteredVideos(videos);
    else setFilteredVideos(videos.filter(v => v.name.startsWith(activeTab)));
  }, [activeTab, videos]);

  // --- DIRECTIVE LOGIC ---
  const getDirective = () => {
    if (videos.length === 0) return "MISSION: LOG YOUR FIRST MASTERY ENTRY.";
    if (videos.length < 5) return "DIRECTIVE: REACH 5 SESSIONS TO UNLOCK 'OPERATOR' STATUS.";
    if (videos.length < 15) return "INTEL: CONSISTENCY IS THE KEY TO GLOBAL DOMINATION.";
    return "STATUS: LEGENDARY. KEEP STACKING THE RECORD.";
  };

  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-10 font-sans">
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] text-center shadow-2xl">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-12">LifeGPS</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none font-bold" />
            <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none font-bold" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs mt-4">Execute Login</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      
      {/* --- HUD HEADER & DIRECTIVE --- */}
      <div className="absolute top-0 w-full z-[100] bg-gradient-to-b from-black via-black/80 to-transparent pb-10">
        <div className="p-8 flex justify-between items-center">
            <button onClick={() => setView('feed')} className="font-black italic text-3xl tracking-tighter">LifeGPS</button>
            <div className="flex gap-4">
                <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_blue] border border-blue-400">👤</button>
            </div>
        </div>
        
        {/* MISSION DIRECTIVE BAR */}
        <div className="px-8 mt-2">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{getDirective()}</p>
            </div>
        </div>
      </div>

      {/* --- FEED --- */}
      {view === 'feed' && (
        <div className="h-full w-full">
           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                
                {/* HUD INFO */}
                <div className="absolute bottom-32 left-8 z-50">
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Verified</span>
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Entry #{filteredVideos.length - i}</span>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* CAPTURE BUTTON */}
          <div className="absolute bottom-10 left-10 z-[100]">
            <label className="cursor-pointer">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <span className="text-black text-3xl font-light">+</span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* --- PROFILE --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 pt-48 px-10 flex flex-col items-center">
          <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[50px] w-full text-center mb-10">
            <h2 className="text-white font-black italic text-2xl uppercase tracking-tighter mb-1">CHIEF OPERATOR</h2>
            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">{user.email}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-10">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[30px] text-center">
                <p className="text-white/40 text-[8px] font-black uppercase mb-1">Sessions</p>
                <p className="text-2xl font-black italic">{videos.length}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[30px] text-center">
                <p className="text-white/40 text-[8px] font-black uppercase mb-1">Tier</p>
                <p className="text-2xl font-black italic">ELITE</p>
             </div>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="mt-auto mb-20 text-red-500/30 text-[9px] font-black uppercase tracking-widest">Terminate Session</button>
        </div>
      )}
    </main>
  );
}
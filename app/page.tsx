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

  // --- UPLOAD ---
  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("IDENTIFY YOUR MASTERY:");
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

  // --- DATA SYNC ---
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

  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-10 font-sans">
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] text-center shadow-2xl">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-12">LifeGPS</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none" />
            <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs mt-4">Identify</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      
      {/* --- HUD HEADER & GLOBAL TICKER --- */}
      <div className="absolute top-0 w-full z-[100] bg-gradient-to-b from-black via-black/60 to-transparent pb-10">
        <div className="p-8 flex justify-between items-center">
            <button onClick={() => setView('feed')} className="font-black italic text-3xl tracking-tighter">LifeGPS</button>
            <div className="flex gap-4">
                <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl">{isMuted ? '🔇' : '🔊'}</button>
                <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400">👤</button>
            </div>
        </div>
        
        {/* GLOBAL ACTIVITY TICKER */}
        <div className="w-full overflow-hidden bg-blue-600/10 border-y border-white/5 py-2">
            <div className="whitespace-nowrap animate-marquee flex gap-10">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">● LIVE: {user.email?.split('@')[0]} logged a new mastery session</p>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">● SYSTEM ONLINE: All tracking nodes active</p>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">● LIVE: {user.email?.split('@')[0]} reached Rank: Operator</p>
            </div>
        </div>
      </div>

      {/* --- FEED --- */}
      {view === 'feed' && (
        <div className="h-full w-full">
           <div className="absolute top-40 w-full z-50 px-8 flex gap-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{cat}</button>
              ))}
           </div>

           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                
                {/* DARK VIGNETTE */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute bottom-32 left-8 z-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_blue]" />
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Verified Data Point</span>
                  </div>
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                  <p className="text-blue-500 font-bold text-[10px] uppercase mt-3 tracking-[0.4em]">Mastery ID: {filteredVideos.length - i}</p>
                </div>
              </section>
            ))}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-8">
            <label className="cursor-pointer group">
              <div className="bg-white text-black py-6 rounded-[35px] flex items-center justify-center shadow-[0_15px_40px_rgba(255,255,255,0.2)] group-active:scale-95 transition-all">
                <span className="font-black uppercase tracking-[0.3em] text-[10px]">{uploading ? "Analyzing..." : "Log Mastery Session"}</span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* --- PROFILE --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 pt-48 px-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500">
          <h2 className="text-white font-black italic text-4xl uppercase tracking-tighter mb-2 text-center">Identity</h2>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] mb-12 text-center">{user.email}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[40px] text-center shadow-inner">
              <p className="text-white/40 text-[9px] font-black uppercase mb-1">Total Tracks</p>
              <p className="text-3xl font-black italic">{categories.length - 1}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[40px] text-center shadow-inner">
              <p className="text-white/40 text-[9px] font-black uppercase mb-1">Total Loops</p>
              <p className="text-3xl font-black italic">{videos.length}</p>
            </div>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="mt-auto mb-20 text-red-500/30 text-[9px] font-black uppercase tracking-[0.4em] hover:text-red-500 transition-all">Disconnect Session</button>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </main>
  );
}
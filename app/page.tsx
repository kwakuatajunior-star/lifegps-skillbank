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
  const [reactions, setReactions] = useState<{[key: string]: number}>({});
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

  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("DEFINE YOUR MASTERY:");
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
        <div className="w-full max-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] text-center">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-12">LifeGPS</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none text-xs font-bold" />
            <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none text-xs font-bold" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs">Unlock Access</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      
      {/* --- HUD --- */}
      <div className="absolute top-0 w-full z-[100] p-8 flex justify-between items-center bg-gradient-to-b from-black via-black/40 to-transparent">
        <button onClick={() => setView('feed')} className="font-black italic text-3xl tracking-tighter">LifeGPS</button>
        <div className="flex gap-4">
            <button onClick={() => setView('leaderboard')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${view === 'leaderboard' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}>🏆</button>
            <button onClick={() => setView('profile')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${view === 'profile' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white'}`}>👤</button>
        </div>
      </div>

      {/* --- FEED --- */}
      {view === 'feed' && (
        <div className="h-full w-full">
           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                <div className="absolute bottom-32 left-8 z-50">
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                  <p className="text-blue-500 font-bold text-[10px] uppercase mt-3 tracking-[0.4em]">Rank: Operator</p>
                </div>
              </section>
            ))}
          </div>
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

      {/* --- LEADERBOARD --- */}
      {view === 'leaderboard' && (
        <div className="h-full w-full bg-zinc-950 pt-40 px-10 animate-in fade-in slide-in-from-bottom-20 duration-500">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Global Rankings</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">World Tier: Elite</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white/10 border border-blue-500/50 p-6 rounded-[35px] flex justify-between items-center shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                <div className="flex items-center gap-4">
                    <span className="text-2xl">👑</span>
                    <div>
                        <p className="text-white font-black italic text-sm uppercase">{user.email?.split('@')[0]}</p>
                        <p className="text-white/30 text-[9px] font-bold uppercase">Current Champion</p>
                    </div>
                </div>
                <p className="text-blue-400 font-black italic text-xl">{videos.length}</p>
            </div>
            {/* Simulation of other users for App Store Look */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-[35px] flex justify-between items-center opacity-40">
                <div className="flex items-center gap-4">
                    <span className="font-black text-white/20 ml-2 italic">02</span>
                    <p className="text-white font-black italic text-sm uppercase tracking-widest">A. Tate</p>
                </div>
                <p className="text-white/20 font-black italic text-xl">--</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFILE --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 pt-48 px-10 flex flex-col items-center">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[50px] w-full text-center">
            <h2 className="text-white font-black italic text-2xl uppercase tracking-tighter mb-1">{user.email?.split('@')[0]}</h2>
            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">Mastery ID: {user.id.slice(0,8)}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="mt-20 text-red-500/30 text-[10px] font-black uppercase tracking-widest">Logout</button>
        </div>
      )}
    </main>
  );
}
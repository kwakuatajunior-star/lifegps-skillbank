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
  const [vision, setVision] = useState("");
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
      const skillName = prompt("IDENTIFY THE SKILL TRACK:");
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

  // --- DATA FETCHING ---
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

  // --- MILESTONE LOGIC ---
  const getRank = (count: number) => {
    if (count >= 20) return { title: "LEGEND", color: "text-purple-500" };
    if (count >= 10) return { title: "EXECUTIVE", color: "text-blue-500" };
    if (count >= 5) return { title: "OPERATOR", color: "text-green-500" };
    return { title: "NOVICE", color: "text-white/40" };
  };

  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-10 font-sans">
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] text-center">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-12 uppercase">LifeGPS</h1>
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
      
      {/* --- TOP NAV --- */}
      <div className="absolute top-0 w-full z-[100] p-8 flex justify-between items-center bg-gradient-to-b from-black via-black/40 to-transparent">
        <button onClick={() => setView('feed')} className={`font-black italic text-3xl tracking-tighter transition-all ${view === 'feed' ? 'text-white' : 'text-white/20'}`}>LifeGPS</button>
        <button onClick={() => setView('profile')} className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all ${view === 'profile' ? 'bg-white text-black border-white shadow-[0_0_30px_white]' : 'bg-white/5 text-white border-white/10'}`}>
          {view === 'profile' ? '✕' : '👤'}
        </button>
      </div>

      {/* --- FEED VIEW --- */}
      {view === 'feed' && (
        <div className="h-full w-full animate-in fade-in duration-500">
           <div className="absolute top-28 w-full z-50 px-8 flex flex-col gap-4">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveTab(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{cat}</button>
                ))}
              </div>
           </div>

           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                <div className="absolute bottom-32 left-8 z-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${getRank(videos.filter(v => v.name.startsWith(video.name.split('_')[0])).length).color}`}>
                      Rank: {getRank(videos.filter(v => v.name.startsWith(video.name.split('_')[0])).length).title}
                    </span>
                  </div>
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                </div>
              </section>
            ))}
          </div>

          <div className="absolute bottom-10 right-10 z-[100]">
            <label className="cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all">
                <span className="text-black text-3xl font-light">+</span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* --- PROFILE VIEW --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 pt-40 px-8 flex flex-col animate-in slide-in-from-bottom-20 duration-500 overflow-y-auto pb-20">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[40px] flex items-center justify-center text-4xl shadow-2xl">🏆</div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">Elite Mastery<br/>Dashboard</h2>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">{user.email}</p>
            </div>
          </div>

          {/* VISION SECTION */}
          <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[45px] mb-8">
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.4em] mb-4 text-center">Identity Vision</p>
            <input 
              type="text"
              placeholder="YOUR ULTIMATE GOAL..."
              value={vision}
              onChange={(e) => setVision(e.target.value.toUpperCase())}
              className="bg-transparent w-full text-center text-white font-black italic text-xl uppercase outline-none border-none"
            />
          </div>

          {/* BADGE SECTION */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className={`aspect-square rounded-[30px] flex flex-col items-center justify-center border ${videos.length >= 1 ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/10 opacity-20'}`}>
              <span className="text-xl mb-1">🌱</span>
              <span className="text-[8px] font-black uppercase">Started</span>
            </div>
            <div className={`aspect-square rounded-[30px] flex flex-col items-center justify-center border ${videos.length >= 10 ? 'bg-green-600/10 border-green-500/50' : 'bg-white/5 border-white/10 opacity-20'}`}>
              <span className="text-xl mb-1">🔥</span>
              <span className="text-[8px] font-black uppercase">Expert</span>
            </div>
            <div className={`aspect-square rounded-[30px] flex flex-col items-center justify-center border ${videos.length >= 50 ? 'bg-purple-600/10 border-purple-500/50' : 'bg-white/5 border-white/10 opacity-20'}`}>
              <span className="text-xl mb-1">👑</span>
              <span className="text-[8px] font-black uppercase">Legend</span>
            </div>
          </div>
          
          <button onClick={() => supabase.auth.signOut()} className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-auto">Logout Session</button>
        </div>
      )}
    </main>
  );
}
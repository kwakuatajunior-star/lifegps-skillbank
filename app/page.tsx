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
  const [feedMode, setFeedMode] = useState('private'); // 'private' or 'global'
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
      const skillName = prompt("WHAT ARE YOU MASTERING?");
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

  const getRank = (count: number) => {
    if (count >= 20) return { title: "LEGEND", color: "text-purple-500", glow: "shadow-[0_0_20px_purple]" };
    if (count >= 10) return { title: "EXECUTIVE", color: "text-blue-500", glow: "shadow-[0_0_20px_blue]" };
    return { title: "OPERATOR", color: "text-green-500", glow: "" };
  };

  if (!user) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center p-10 font-sans text-white">
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] text-center shadow-2xl">
          <h1 className="text-4xl font-black italic tracking-tighter mb-12">LifeGPS</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl outline-none" />
            <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl outline-none" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs">Authenticate</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      
      {/* --- TOP NAV --- */}
      <div className="absolute top-0 w-full z-[100] p-8 flex flex-col gap-6 bg-gradient-to-b from-black to-transparent">
        <div className="flex justify-between items-center">
            <div className="flex gap-4">
                <button onClick={() => {setView('feed'); setFeedMode('private')}} className={`font-black italic text-2xl tracking-tighter transition-all ${view === 'feed' && feedMode === 'private' ? 'text-white' : 'text-white/20'}`}>LifeGPS</button>
                <button onClick={() => {setView('feed'); setFeedMode('global')}} className={`font-black italic text-2xl tracking-tighter transition-all ${feedMode === 'global' ? 'text-blue-500' : 'text-white/20'}`}>Global</button>
            </div>
            <button onClick={() => setView('profile')} className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all ${view === 'profile' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10'}`}>
                {view === 'profile' ? '✕' : '👤'}
            </button>
        </div>
      </div>

      {/* --- FEED VIEW --- */}
      {view === 'feed' && (
        <div className="h-full w-full">
           <div className="absolute top-28 w-full z-50 px-8 flex gap-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{cat}</button>
              ))}
           </div>

           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {feedMode === 'private' ? filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                
                {/* SHARE BUTTON */}
                <div className="absolute right-8 bottom-48 z-50">
                    <button onClick={() => {navigator.clipboard.writeText(window.location.href); alert("Mastery Link Copied!")}} className="w-16 h-16 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full flex items-center justify-center text-xl shadow-2xl">🔗</button>
                </div>

                <div className="absolute bottom-32 left-8 z-50">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${getRank(videos.length).color} mb-2 block`}>Verified {getRank(videos.length).title}</span>
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                </div>
              </section>
            )) : (
                <div className="h-screen w-full flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-4xl mb-6">🌍</span>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Global Mastery Hub</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">Soon, you will see masteries from around the world here. Keep building.</p>
                </div>
            )}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100]">
            <label className="cursor-pointer">
              <div className="bg-white text-black px-12 py-6 rounded-[35px] flex items-center justify-center shadow-2xl active:scale-95 transition-all">
                <span className="font-black uppercase tracking-[0.3em] text-[10px]">Log Mastery</span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* --- PROFILE VIEW --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 pt-40 px-8 flex flex-col overflow-y-auto pb-32">
          <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[50px] mb-8 text-center">
             <div className="w-20 h-20 bg-blue-600 rounded-[30px] mx-auto mb-6 flex items-center justify-center text-3xl">👨‍🚀</div>
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">Chief Operator</h2>
             <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest mt-2">{user.email}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] text-center">
                <p className="text-white/40 text-[8px] font-black uppercase mb-1">Sessions</p>
                <p className="text-3xl font-black italic">{videos.length}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] text-center">
                <p className="text-white/40 text-[8px] font-black uppercase mb-1">Level</p>
                <p className="text-3xl font-black italic">{getRank(videos.length).title.slice(0,3)}</p>
             </div>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="mt-12 text-red-500/40 text-[10px] font-black uppercase tracking-widest">Logout</button>
        </div>
      )}
    </main>
  );
}
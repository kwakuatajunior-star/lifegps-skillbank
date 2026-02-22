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
  const [view, setView] = useState('feed'); // 'feed' or 'profile'
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
      const skillName = prompt("NAME THIS MASTERY TRACK:");
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
      
      {/* --- TOP NAVIGATION --- */}
      <div className="absolute top-0 w-full z-[100] p-8 flex justify-between items-center bg-gradient-to-b from-black to-transparent">
        <button onClick={() => setView('feed')} className={`font-black italic text-2xl tracking-tighter transition-opacity ${view === 'feed' ? 'opacity-100' : 'opacity-30'}`}>LifeGPS</button>
        <button onClick={() => setView('profile')} className={`uppercase text-[10px] font-black tracking-widest px-4 py-2 rounded-full border transition-all ${view === 'profile' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}>Profile</button>
      </div>

      {/* --- VIEW 1: THE FEED --- */}
      {view === 'feed' && (
        <div className="h-full w-full">
           {/* CATEGORY BAR (ONLY IN FEED) */}
           <div className="absolute top-28 w-full z-50 px-8 flex gap-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{cat}</button>
              ))}
           </div>

           <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
            {filteredVideos.map((video, i) => (
              <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
                <video src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline />
                <div className="absolute bottom-28 left-8 z-50">
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">{video.name.split('_')[0]}</h2>
                  <p className="text-blue-500 font-bold text-[10px] uppercase mt-2 tracking-widest">Entry #{filteredVideos.length - i}</p>
                </div>
              </section>
            ))}
          </div>

          {/* FLOATING ACTION BUTTON */}
          <div className="absolute bottom-10 right-10 z-[100]">
            <label className="cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <span className="text-black text-3xl font-light">+</span>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      )}

      {/* --- VIEW 2: THE PROFILE --- */}
      {view === 'profile' && (
        <div className="h-full w-full bg-zinc-950 flex flex-col items-center pt-40 px-10 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(37,99,235,0.4)] mb-6">🛰️</div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Chief Operator</h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] mb-12">{user.email}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] text-center">
              <p className="text-white/40 text-[9px] font-black uppercase mb-1">Total Skills</p>
              <p className="text-2xl font-black italic">{categories.length - 1}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] text-center">
              <p className="text-white/40 text-[9px] font-black uppercase mb-1">Sessions</p>
              <p className="text-2xl font-black italic">{videos.length}</p>
            </div>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="mt-20 text-red-500/50 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">Terminate Session</button>
        </div>
      )}
    </main>
  );
}
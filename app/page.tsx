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
    if (error) alert("Access Requested.");
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

  // --- FETCH & ANALYTICS ---
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
    if (activeTab === "ALL") {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter(v => v.name.startsWith(activeTab)));
    }
  }, [activeTab, videos]);

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
  }, [filteredVideos, isMuted]);

  if (!user) {
    return (
        <main className="h-screen w-full bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[50px] text-center">
                <h1 className="text-white text-5xl font-black italic tracking-tighter mb-12">LifeGPS</h1>
                <div className="flex flex-col gap-5">
                    <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none" />
                    <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white outline-none" />
                    <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs">Unlock</button>
                </div>
            </div>
        </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      {/* ANALYTICS HEADER */}
      <div className="absolute top-0 w-full z-50 pt-8 px-8 flex flex-col gap-6 bg-gradient-to-b from-black via-black/80 to-transparent pb-10">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-black text-3xl italic tracking-tighter">LifeGPS</h1>
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">
                    {activeTab === "ALL" ? `${videos.length} Total Sessions` : `${filteredVideos.length} ${activeTab} Sessions`}
                </p>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl text-lg">
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
                <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === cat ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {filteredVideos.map((video, i) => (
          <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            <div className="absolute bottom-24 left-8 right-28 z-50">
               <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 rounded-[45px] shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-white/40 font-black text-[9px] uppercase tracking-[0.4em]">Optimized Performance</span>
                  </div>
                  <h2 className="text-white font-black italic text-4xl uppercase tracking-tighter leading-none mb-2">
                    {video.name.split('_')[0]}
                  </h2>
                  <p className="text-blue-500 font-bold text-[10px] uppercase">Entry #{filteredVideos.length - i}</p>
               </div>
            </div>
          </section>
        ))}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="absolute bottom-8 right-8 z-[100]">
        <label className="cursor-pointer">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <span className="text-black text-3xl font-light">+</span>
            </div>
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
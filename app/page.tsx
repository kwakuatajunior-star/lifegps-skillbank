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
    if (error) alert("Verification link sent!");
  };

  // --- DELETE ---
  const handleDelete = async (videoName: string) => {
    if (!confirm("Erase this mastery session?")) return;
    const { error } = await supabase.storage.from('videos').remove([videoName]);
    if (error) alert(error.message);
    else window.location.reload();
  };

  // --- UPLOAD ---
  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("DEFINE SKILL (e.g. TRADING, BOXING, CODE)");
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
        <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-12 rounded-[60px] text-center shadow-2xl">
          <h1 className="text-white text-4xl font-black italic tracking-tighter mb-10">LifeGPS</h1>
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white text-xs font-bold outline-none" />
            <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white text-xs font-bold outline-none" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs mt-4">Identify</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white">
      {/* GLASS HEADER */}
      <div className="absolute top-0 w-full z-50 pt-10 px-8 flex flex-col gap-6 bg-gradient-to-b from-black via-black/40 to-transparent pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-black text-3xl italic tracking-tighter text-white">LifeGPS</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.4em]">{activeTab} TRACK ACTIVE</p>
            </div>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-[24px]">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeTab === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {filteredVideos.map((video, i) => (
          <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-950">
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            {/* GLASS SIDEBAR */}
            <div className="absolute right-6 bottom-40 z-50 flex flex-col gap-5">
              <button onClick={() => setActiveMenu(video.name)} className="w-14 h-14 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl flex items-center justify-center text-white text-xl">...</button>
              <div className="w-14 h-14 bg-blue-600/10 backdrop-blur-3xl border border-blue-500/20 rounded-3xl flex items-center justify-center flex-col">
                <span className="text-blue-400 text-[10px] font-black italic">#{filteredVideos.length - i}</span>
              </div>
            </div>

            {/* INFO PANEL */}
            <div className="absolute bottom-16 left-8 right-28 z-50">
               <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
                  <h2 className="text-white font-black italic text-4xl uppercase tracking-tighter leading-none">
                    {video.name.split('_')[0]}
                  </h2>
               </div>
            </div>

            {/* DELETE POPUP */}
            {activeMenu === video.name && (
              <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end" onClick={() => setActiveMenu(null)}>
                <div className="w-full bg-zinc-950 p-12 rounded-t-[50px] border-t border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDelete(video.name)} className="w-full py-6 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] bg-red-500/5 rounded-3xl border border-red-500/10">DELETE LOOP</button>
                  <button onClick={() => setActiveMenu(null)} className="w-full py-6 mt-4 text-white/20 font-black uppercase text-[9px] tracking-widest text-center">CANCEL</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* FLOATING ACTION */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[80] w-full max-w-xs px-6">
        <label className="cursor-pointer group">
          <div className="bg-white text-black py-6 rounded-[35px] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">
              {uploading ? "SYNCING..." : "CAPTURE MASTERY"}
            </span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
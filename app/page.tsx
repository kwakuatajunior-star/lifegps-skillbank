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

  // --- IDENTITY CHECK ---
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

  // --- UPLOAD ENGINE ---
  const handleUpload = async (event: any) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const skillName = prompt("NAME THIS MASTERY:");
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

  const handleDelete = async (videoName: string) => {
    if (!confirm("Erase from permanent record?")) return;
    const { error } = await supabase.storage.from('videos').remove([videoName]);
    if (error) alert(error.message);
    else window.location.reload();
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
      <main className="h-screen w-full bg-zinc-950 flex items-center justify-center p-10">
        <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 backdrop-blur-3xl p-12 rounded-[60px] shadow-2xl">
          <h1 className="text-white text-5xl font-black italic tracking-tighter mb-4 text-center">LifeGPS</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.5em] mb-12 text-center">Identity Lock</p>
          <div className="flex flex-col gap-5">
            <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white text-xs font-bold outline-none" />
            <input type="password" placeholder="CODE" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-white text-xs font-bold outline-none" />
            <button onClick={handleLogin} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-xs mt-4 hover:shadow-[0_0_30px_white] transition-all">Authenticate</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden relative bg-black text-white font-sans">
      {/* HUD DASHBOARD */}
      <div className="absolute top-0 w-full z-50 pt-12 px-8 flex flex-col gap-8 bg-gradient-to-b from-black via-black/60 to-transparent pb-24">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-black text-4xl italic tracking-tighter">LifeGPS</h1>
            <p className="text-blue-500 text-[8px] font-black uppercase tracking-[0.4em] mt-2">Active Tracker: {activeTab}</p>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/5 backdrop-blur-3xl border border-white/10 p-5 rounded-[30px] shadow-2xl">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === cat ? 'bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.5)]' : 'bg-white/5 border-white/10 text-white/30'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MASTERY FEED */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {filteredVideos.map((video, i) => (
          <section key={video.name} className="h-screen w-full snap-start relative flex items-center justify-center bg-zinc-900">
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
            <video ref={(el) => { videoRefs.current[i] = el; }} src={`https://ghzeqhwftrsdnhzvnayt.supabase.co/storage/v1/object/public/videos/${video.name}`} className="w-full h-full object-cover" loop playsInline muted={true} />
            
            {/* ACTION TOOLS */}
            <div className="absolute right-8 bottom-48 z-50 flex flex-col gap-6">
              <button onClick={() => setActiveMenu(video.name)} className="w-16 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[28px] flex items-center justify-center text-white text-xl shadow-2xl active:scale-90 transition-all">...</button>
              <div className="w-16 h-16 bg-blue-600/10 backdrop-blur-3xl border border-blue-500/20 rounded-[28px] flex items-center justify-center flex-col shadow-inner">
                <span className="text-blue-400 text-[11px] font-black italic">#{filteredVideos.length - i}</span>
              </div>
            </div>

            {/* IDENTITY PANEL */}
            <div className="absolute bottom-20 left-8 right-32 z-50">
               <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 rounded-[55px] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">Verified Data Point</span>
                  </div>
                  <h2 className="text-white font-black italic text-5xl uppercase tracking-tighter leading-none">
                    {video.name.split('_')[0]}
                  </h2>
               </div>
            </div>

            {/* DELETE OVERLAY */}
            {activeMenu === video.name && (
              <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-3xl flex items-end animate-in fade-in duration-300" onClick={() => setActiveMenu(null)}>
                <div className="w-full bg-zinc-950 p-14 rounded-t-[60px] border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-500" onClick={e => e.stopPropagation()}>
                  <div className="w-14 h-1.5 bg-white/10 rounded-full mx-auto mb-14" />
                  <button onClick={() => handleDelete(video.name)} className="w-full py-7 text-red-500 font-black uppercase tracking-[0.3em] text-[11px] bg-red-500/5 rounded-[30px] border border-red-500/20 shadow-2xl">DELETE MASTER RECORD</button>
                  <button onClick={() => setActiveMenu(null)} className="w-full py-7 mt-6 text-white/20 font-black uppercase text-[10px] tracking-widest text-center">EXIT COMMAND</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CAPTURE BUTTON */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[80] w-full max-w-sm px-8">
        <label className="cursor-pointer group">
          <div className="bg-white text-black py-7 rounded-[40px] flex items-center justify-center gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.4)] group-active:scale-95 transition-all duration-300 border-[6px] border-black/5">
            <span className="font-black uppercase tracking-[0.3em] text-[11px]">CAPTURE MASTERY</span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </main>
  );
}
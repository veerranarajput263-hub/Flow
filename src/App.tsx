import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  User, 
  Repeat, 
  GitFork, 
  Code2, 
  Music, 
  Image as ImageIcon,
  MoreVertical,
  Share2,
  Sparkles,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { fluxService } from './lib/flux-service';
import { cn } from './lib/utils';
import { GoogleGenAI } from "@google/genai";

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'explore', icon: Search, label: 'Explore' },
    { id: 'create', icon: PlusSquare, label: 'Create', primary: true },
    { id: 'activity', icon: Heart, label: 'Activity' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-6 py-3 pb-8 md:pb-3 max-w-md mx-auto rounded-t-2xl">
      <div className="flex justify-between items-center relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex flex-col items-center transition-all duration-300",
              activeTab === tab.id ? "text-[#00f2ff]" : "text-white/40 hover:text-white/70",
              tab.primary && "translate-y-[-12px]"
            )}
          >
            {tab.primary ? (
              <div className="bg-neon-cyan p-3 rounded-2xl shadow-lg transform active:scale-95 transition-transform">
                <tab.icon size={24} className="text-[#050505]" />
              </div>
            ) : (
              <>
                <tab.icon size={22} />
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-[#00f2ff]" 
                  />
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

const RemixModal = ({ post, onClose }: { post: any, onClose: () => void }) => {
  const [style, setStyle] = useState<'cyberpunk' | 'minimalist' | 'brutalist' | 'ethereal'>('cyberpunk');
  const [newPrompt, setNewPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [remixedUrl, setRemixedUrl] = useState('');

  const styles = [
    { id: 'cyberpunk', label: 'Cyberpunk', icon: '⚡' },
    { id: 'minimalist', label: 'Minimal', icon: '⚪' },
    { id: 'brutalist', label: 'Brutal', icon: '⬛' },
    { id: 'ethereal', label: 'Dreamy', icon: '✨' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    const { suggestRemix } = await import('./lib/gemini');
    const prompt = await suggestRemix(post.prompt || post.description, style);
    setNewPrompt(prompt);
    // In a real app, feed this to an image gen API. 
    // Here we seed a new picsum image for the demo.
    setRemixedUrl(`https://picsum.photos/seed/${Math.random()}/800/800`);
    setLoading(false);
  };

  const handlePublish = async () => {
    setLoading(true);
    await fluxService.createPost({
      title: `Remix of ${post.title}`,
      description: `A ${style} interpretation of the original vision.`,
      type: 'image',
      contentUrl: remixedUrl,
      prompt: newPrompt,
      tags: [...(post.tags || []), style, 'remix']
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#050505] p-6 pt-12 overflow-auto"
    >
      <div className="max-w-md mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Remixing <span className="neon-pink">Vision</span></h2>
          <button onClick={onClose} className="p-2 glass rounded-full"><PlusSquare className="rotate-45" /></button>
        </div>

        {!remixedUrl ? (
          <div className="flex-1 space-y-8">
            <div className="glass rounded-3xl p-6 aspect-video overflow-hidden">
               <img src={post.contentUrl} className="w-full h-full object-cover opacity-50 grayscale" referrerPolicy="no-referrer" />
               <div className="mt-4">
                 <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Source Objective</p>
                 <p className="text-sm italic line-clamp-2">"{post.prompt || post.description}"</p>
               </div>
            </div>

            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-4">Select Algorithm Style</p>
              <div className="grid grid-cols-2 gap-3">
                {styles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id as any)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left",
                      style === s.id ? "border-[#ff007f] bg-[#ff007f]/10" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <span className="text-lg mb-2 block">{s.icon}</span>
                    <p className={cn("text-xs font-bold uppercase tracking-wider", style === s.id ? "text-[#ff007f]" : "text-white/40")}>{s.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-neon-pink text-white py-5 rounded-3xl font-bold uppercase tracking-[0.2em] transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Re-aligning Neurons..." : <><Sparkles size={18} /> Run Remix Engine</>}
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-8">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }}
               className="glass rounded-3xl overflow-hidden"
            >
              <img src={remixedUrl} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
              <div className="p-6 bg-[#00f2ff]/5 border-t border-[#00f2ff]/10">
                <p className="text-[10px] text-[#00f2ff] uppercase font-bold tracking-widest mb-2">Generated Logic</p>
                <p className="text-sm italic font-medium leading-relaxed">"{newPrompt}"</p>
              </div>
            </motion.div>

            <div className="flex gap-4">
              <button 
                onClick={() => setRemixedUrl('')}
                className="flex-1 glass py-5 rounded-3xl font-bold uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button 
                onClick={handlePublish}
                className="flex-[2] bg-neon-cyan text-[#050505] py-5 rounded-3xl font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,242,255,0.4)]"
              >
                Publish Remix
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const PostCard = ({ post }: { post: any, [key: string]: any }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRemix, setShowRemix] = useState(false);

  const handleLike = () => {
    fluxService.likePost(post.id);
    setIsLiked(true);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl overflow-hidden mb-6 group relative"
      >
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={post.creatorPhoto} 
              alt={post.creatorName} 
              className="w-10 h-10 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-sm font-semibold">{post.creatorName}</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Creators Guild • {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
            </div>
          </div>
          <button className="text-white/40"><MoreVertical size={18} /></button>
        </div>

        {/* Main Content Area */}
        <div className="relative aspect-square bg-[#111]">
          {post.type === 'image' && (
            <img 
              src={post.contentUrl} 
              alt={post.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          {post.type === 'code' && (
            <div className="w-full h-full p-6 font-mono text-xs bg-[#0a0a0a] overflow-auto">
              <div className="flex items-center gap-2 mb-4 text-[#00f2ff]/60">
                <Code2 size={14} />
                <span className="uppercase tracking-widest text-[9px]">Source Code</span>
              </div>
              <pre className="text-white/80">{post.description || '// No snippet provided'}</pre>
            </div>
          )}
          {post.type === 'audio' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
              <div className="w-20 h-20 rounded-full bg-[#ff007f]/20 flex items-center justify-center border border-[#ff007f]/30 mb-4 shadow-[0_0_30px_rgba(255,0,127,0.2)]">
                <Music size={32} className="text-[#ff007f]" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Audio Transmission</p>
            </div>
          )}
          {post.type === '3d' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505]">
              <div className="w-32 h-32 glass rounded-[2rem] flex items-center justify-center mb-4 relative overflow-hidden group/box">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2ff]/20 to-transparent" />
                <Box size={48} className="text-[#00f2ff] relative z-10 group-hover/box:rotate-12 transition-transform" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#00f2ff]">3D Object Module</p>
            </div>
          )}
          
          {/* Overlay Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {post.type === 'image' && <div className="glass px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><ImageIcon size={10} /> Visual</div>}
            {post.type === 'code' && <div className="glass px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 text-[#00f2ff] border-[#00f2ff]/30"><Code2 size={10} /> Logic</div>}
            {post.type === 'audio' && <div className="glass px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 text-[#ff007f] border-[#ff007f]/30"><Music size={10} /> Sonic</div>}
            {post.type === '3d' && <div className="glass px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 text-[#00f2ff] border-[#00f2ff]/30"><Box size={10} /> Spatial</div>}
          </div>

          {/* Prompt Snippet Hover */}
          <AnimatePresence>
            {showPrompt && post.prompt && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="absolute inset-0 bg-[#050505]/60 p-8 flex flex-col justify-center items-start text-left"
              >
                <div className="flex items-center gap-2 mb-2 text-[#00f2ff]">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Generative Prompt</span>
                </div>
                <p className="text-sm font-medium italic text-white/90">"{post.prompt}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interaction Bar */}
        <div className="p-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-5">
              <button 
                onClick={handleLike}
                className={cn("flex items-center gap-1.5 transition-colors", isLiked ? "text-pink-500" : "text-white/60 hover:text-white")}
              >
                <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                <span className="text-xs font-medium">{post.likesCount || 0}</span>
              </button>
              <button 
                onClick={() => setShowPrompt(!showPrompt)}
                className={cn("flex items-center gap-1.5 hover:text-[#00f2ff] transition-colors", showPrompt ? "text-[#00f2ff]" : "text-white/60")}
              >
                <Sparkles size={22} />
                <span className="text-xs font-medium">{post.remixCount || 0}</span>
              </button>
              <button 
                onClick={() => fluxService.forkPost(post.id)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
              >
                <GitFork size={22} />
                <span className="text-xs font-medium">{post.forkCount || 0}</span>
              </button>
            </div>
            <button className="text-white/60 hover:text-white"><Share2 size={22} /></button>
          </div>

          <h4 className="font-bold mb-1">{post.title}</h4>
          <p className="text-sm text-white/60 line-clamp-2">{post.description}</p>
          
          <div className="mt-4 flex gap-2 flex-wrap">
            {post.tags?.map((tag: string) => (
              <span key={tag} className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#00f2ff]/20 bg-[#00f2ff]/5">#{tag}</span>
            ))}
          </div>

          <button 
            onClick={() => setShowRemix(true)}
            className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group"
          >
            <Repeat size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Remix This Vision
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showRemix && (
          <RemixModal post={post} onClose={() => setShowRemix(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

const CreatePostView = ({ onComplete }: { onComplete: () => void }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('image');
  const [contentUrl, setContentUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fluxService.createPost({
        title,
        description: desc,
        type,
        contentUrl: contentUrl || `https://picsum.photos/seed/${Math.random()}/800/800`, // Default if empty
        prompt,
        tags: ['remix', type]
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 h-full overflow-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Drop your <span className="neon-cyan">Vision</span></h2>
        <Sparkles className="text-[#00f2ff]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-2">Asset Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['image', 'code', 'audio', '3d'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "py-3 rounded-2xl border transition-all uppercase text-[10px] font-bold tracking-widest flex items-center justify-center gap-2",
                  type === t ? "border-[#00f2ff] bg-[#00f2ff]/10 text-[#00f2ff]" : "border-white/10 text-white/40 hover:border-white/20"
                )}
              >
                {t === 'image' && <ImageIcon size={14} />} 
                {t === 'code' && <Code2 size={14} />} 
                {t === 'audio' && <Music size={14} />} 
                {t === '3d' && <Box size={14} />} 
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <input 
            placeholder="Post Title..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00f2ff]/50 transition-colors"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea 
            placeholder={type === 'code' ? "Paste your script here..." : "Describe your work..."}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00f2ff]/50 transition-colors resize-none"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            required
          />
          {type === 'image' && (
            <input 
              placeholder="Image URL (or leave blank for placeholder)..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00f2ff]/50 transition-colors"
              value={contentUrl}
              onChange={e => setContentUrl(e.target.value)}
            />
          )}
          <input 
            placeholder="AI Prompt used (Optional)..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 border-dashed border-white/20 focus:outline-none focus:border-[#00f2ff]/50 transition-colors"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-neon-cyan text-[#050505] py-5 rounded-3xl font-bold uppercase tracking-[0.2em] transform active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Transmitting..." : "Broadcast to Network"}
        </button>
      </form>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fluxService.ensureUser();
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user && activeTab === 'home') {
      return fluxService.subscribeToFeed(setPosts);
    }
  }, [user, activeTab]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-[#00f2ff] font-bold text-4xl tracking-tighter"
      >
        FLUX
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_50%_50%,#00f2ff1a_0%,transparent_50%)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs"
      >
        <div className="w-24 h-24 bg-neon-cyan rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 rotate-12 shadow-[0_0_50px_rgba(0,242,255,0.3)]">
          <Sparkles size={48} className="text-[#050505]" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-4">FLUX</h1>
        <p className="text-white/40 text-sm mb-12 uppercase tracking-widest leading-loose">
          The next evolution of social commerce. Build. Remix. Repeat.
        </p>
        <button 
          onClick={login}
          className="w-full bg-white text-black py-4 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 py-4 px-6 flex justify-between items-center max-w-md mx-auto rounded-b-2xl">
        <h1 className="text-xl font-bold tracking-tighter">FLUX</h1>
        <div className="flex gap-4">
          <button className="p-2 glass rounded-full"><Search size={18} /></button>
          <img src={user.photoURL!} className="w-8 h-8 rounded-full border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]" referrerPolicy="no-referrer" alt="me" />
        </div>
      </header>

      <main className="pt-24 px-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {posts.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center">
                    <Sparkles className="text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm uppercase tracking-widest">Nothing built yet. Be the first.</p>
                </div>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} />)
              )}
            </motion.div>
          )}

          {activeTab === 'create' && (
            <div key="create" className="fixed inset-0 z-[100] bg-[#050505] pt-12 pb-32">
              <CreatePostView onComplete={() => setActiveTab('home')} />
              <button 
                onClick={() => setActiveTab('home')}
                className="absolute top-6 right-6 p-3 glass rounded-full text-white/40"
              >
                Close
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
             <motion.div 
                key="profile"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <img src={user.photoURL!} className="w-24 h-24 rounded-[2.5rem] border-2 border-[#00f2ff] p-1" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-2 -right-2 bg-neon-cyan p-2 rounded-full border-4 border-[#050505]">
                      <Sparkles size={14} className="text-[#050505]" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold">{user.displayName}</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mt-1">Level 42 Architect</p>
                </div>

                <div className="grid grid-cols-3 gap-1 divide-x divide-white/5 text-center py-6 glass rounded-3xl">
                  <div>
                    <div className="text-lg font-bold">1.2K</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Forks</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">842</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Remixes</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">12.5K</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Guild</div>
                  </div>
                </div>

                <button 
                  onClick={() => auth.signOut()}
                  className="w-full py-4 rounded-2xl glass text-pink-500 font-bold uppercase text-[10px] tracking-widest"
                >
                  Terminate Connection
                </button>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

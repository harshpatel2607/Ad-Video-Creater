
import React, { useState, useEffect, useRef } from 'react';
import { AdScene, LogoConfig } from '../types';
import { videoRenderer } from '../services/videoRenderer';

interface FinalPreviewProps {
  scenes: AdScene[];
  productName: string;
  finalVideoUrl?: string;
  finalAudioUrl?: string;
}

const FinalPreview: React.FC<FinalPreviewProps> = ({ scenes, productName, finalVideoUrl, finalAudioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReRendering, setIsReRendering] = useState(false);
  const [masterVideoUrl, setMasterVideoUrl] = useState(finalVideoUrl);
  const [logo, setLogo] = useState<LogoConfig | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isPlaying) videoRef.current?.play().catch(() => {});
    else videoRef.current?.pause();
  }, [isPlaying]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo({
          url: reader.result as string,
          x: 100,
          y: 100,
          scale: 0.15
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const applyLogoAndMaster = async () => {
    setIsReRendering(true);
    try {
      const result = await videoRenderer.renderMasterAd(scenes, logo || undefined);
      setMasterVideoUrl(result.videoUrl);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReRendering(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !logo || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1280;
    const y = ((e.clientY - rect.top) / rect.height) * 720;
    setLogo({ ...logo, x: Math.max(0, x), y: Math.max(0, y) });
  };

  const downloadMasterAd = () => {
    if (!masterVideoUrl) return;
    const link = document.createElement('a');
    link.href = masterVideoUrl;
    link.download = `${productName.replace(/\s+/g, '_')}_Final_Campaign.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-10 pb-20">
      <div className="text-center space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">MASTER PRODUCTION SUITE</span>
        <h2 className="text-6xl font-black tracking-tighter leading-none">{productName}</h2>
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className="relative aspect-video bg-[#050505] rounded-[4rem] overflow-hidden shadow-5xl border border-white/10 ring-1 ring-white/20 group cursor-default"
      >
        <video 
          ref={videoRef}
          src={masterVideoUrl}
          className="w-full h-full object-cover"
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {logo && (
          <div 
            style={{
              position: 'absolute',
              left: `${(logo.x / 1280) * 100}%`,
              top: `${(logo.y / 720) * 100}%`,
              width: `${logo.scale * 100}%`,
              cursor: isDragging ? 'grabbing' : 'grab',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            className="group/logo relative z-20 transition-transform active:scale-95"
          >
            <div className={`absolute -inset-4 border-2 border-blue-500/50 rounded-xl transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/logo:opacity-100'}`}></div>
            <img src={logo.url} className="w-full h-auto pointer-events-none drop-shadow-2xl" />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex space-x-1 opacity-0 group-hover/logo:opacity-100 transition-all scale-75 group-hover/logo:scale-100">
              <button onClick={(e) => { e.stopPropagation(); setLogo({...logo, scale: logo.scale + 0.02}); }} className="w-8 h-8 bg-blue-600 rounded-full text-white font-bold shadow-lg hover:bg-blue-500">+</button>
              <button onClick={(e) => { e.stopPropagation(); setLogo({...logo, scale: Math.max(0.02, logo.scale - 0.02)}); }} className="w-8 h-8 bg-neutral-800 rounded-full text-white font-bold shadow-lg hover:bg-neutral-700">-</button>
            </div>
          </div>
        )}
        
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-16 transition-opacity duration-500 ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 bg-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest">MASTER PREVIEW</span>
              <p className="text-xl font-medium max-w-lg leading-tight italic text-white/90">Click play to verify Music & SFX Mix</p>
            </div>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-4xl"
            >
              {isPlaying ? (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
              ) : (
                <svg className="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h3 className="text-sm font-black uppercase tracking-[0.4em] flex items-center">
               <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
               Brand Configuration
             </h3>
             <p className="text-[10px] text-white/30 uppercase tracking-widest">Optional: Burn your logo into the master sequence</p>
          </div>
          <div className="flex space-x-4">
            <label className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center space-x-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span>Upload Logo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
            {logo && (
              <button 
                onClick={applyLogoAndMaster}
                disabled={isReRendering}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {isReRendering ? 'Mixing Master...' : 'Finalize Master A/V'}
              </button>
            )}
          </div>
        </div>
        
        {logo && (
          <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-2xl flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-relaxed">
              Manual Positioning Active: Drag the logo in the preview above to desired spot. Click "Finalize Master A/V" to commit.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <button 
           onClick={downloadMasterAd}
           className="py-12 bg-white text-black font-black rounded-[3rem] hover:bg-blue-600 hover:text-white transition-all uppercase tracking-[0.4em] text-xs shadow-4xl flex flex-col items-center justify-center space-y-3 group"
         >
           <div className="flex items-center space-x-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="text-sm">Download Master Ad</span>
           </div>
           <div className="flex items-center space-x-2 opacity-40">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             <span className="text-[10px]">A/V Synced Master MP4</span>
           </div>
         </button>
         
         <button 
           onClick={() => window.location.reload()}
           className="py-12 bg-neutral-900 text-white font-black rounded-[3rem] hover:bg-neutral-800 transition-all uppercase tracking-[0.4em] text-xs shadow-2xl flex flex-col items-center justify-center space-y-3 group border border-white/10"
         >
           <div className="flex items-center space-x-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="text-sm">Restart Director</span>
           </div>
           <span className="text-[10px] opacity-30">Clear Campaign History</span>
         </button>
      </div>
    </div>
  );
};

export default FinalPreview;

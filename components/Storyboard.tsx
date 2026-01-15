
import React from 'react';
import { AdStoryboard, AdScene } from '../types';

interface StoryboardProps {
  storyboard: AdStoryboard;
  producedScenes: AdScene[];
  onConfirm: () => void;
  isGeneratingClips: boolean;
  progress: number;
}

const Storyboard: React.FC<StoryboardProps> = ({ storyboard, producedScenes, onConfirm, isGeneratingClips, progress }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-600/20">Blueprint Approved</span>
            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">v3.1 Master</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-white">{storyboard.productName}</h2>
          <p className="text-white/40 text-sm font-medium">Strategic Narrative: {storyboard.scenes.length} Production Segments</p>
        </div>
        
        {!isGeneratingClips && (
          <button
            onClick={onConfirm}
            className="group relative px-10 py-5 bg-white text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="relative z-10 flex items-center space-x-3 uppercase tracking-widest text-[10px]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
              <span>Initialize Production</span>
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {storyboard.scenes.map((blueprintScene, idx) => {
          // Sync check: Find if this specific scene has been produced yet
          const producedScene = producedScenes.find(s => s.id === idx);
          const isPending = isGeneratingClips && !producedScene;
          const isActive = isGeneratingClips && producedScenes.length === idx;

          return (
            <div 
              key={idx} 
              className={`group relative bg-white/[0.02] border rounded-[2.5rem] overflow-hidden transition-all duration-500 ${
                producedScene ? 'border-white/10 shadow-2xl' : 
                isActive ? 'border-blue-500/50 bg-blue-500/5 ring-4 ring-blue-500/10' : 
                'border-white/5 opacity-60'
              }`}
            >
              <div className="aspect-video bg-[#050505] relative flex items-center justify-center overflow-hidden">
                {producedScene?.videoUrl ? (
                  <video 
                    src={producedScene.videoUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    {isActive ? (
                      <div className="relative">
                        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-500">
                          {idx + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/20 font-black text-xs">
                        {idx + 1}
                      </div>
                    )}
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                      {isActive ? 'Directing...' : 'Pending'}
                    </p>
                  </div>
                )}
                
                {producedScene && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-green-500 text-[8px] font-black text-white uppercase rounded tracking-widest shadow-lg">
                    Master Cut Ready
                  </div>
                )}
              </div>

              <div className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{blueprintScene.type}</span>
                  <span className="text-[10px] font-mono font-bold text-white/20">{blueprintScene.duration}s</span>
                </div>
                
                <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                  "{blueprintScene.script}"
                </p>

                <div className="pt-5 border-t border-white/5 space-y-2">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Visual Directive</p>
                  <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{blueprintScene.visualPrompt}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Storyboard;


import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AdForm from './components/AdForm';
import Storyboard from './components/Storyboard';
import FinalPreview from './components/FinalPreview';
import { AdStoryboard, AdGenerationState, Language, Duration, AdScene } from './types';
import { adDirector } from './services/gemini';
import { videoRenderer } from './services/videoRenderer';

const DIRECTOR_MESSAGES = [
  "Synchronizing campaign strategy...",
  "Calibrating cinematic lens geometry...",
  "Mixing background melodic energy...",
  "Directing brand-locked product reveals...",
  "Encoding master narration tracks...",
  "Mastering SFX layers (Whoosh/Dings)...",
  "Executing Final Master Render...",
  "Verifying export integrity..."
];

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [storyboard, setStoryboard] = useState<AdStoryboard | null>(null);
  const [scenes, setScenes] = useState<AdScene[]>([]);
  const [productImage, setProductImage] = useState<string | undefined>();
  const [directorMsgIdx, setDirectorMsgIdx] = useState(0);
  const [state, setState] = useState<AdGenerationState>({
    isProcessing: false,
    currentStep: 'idle',
    progress: 0,
    message: ''
  });

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: any;
    if (state.isProcessing) {
      interval = setInterval(() => {
        setDirectorMsgIdx(prev => (prev + 1) % DIRECTOR_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [state.isProcessing]);

  const checkApiKey = async () => {
    const has = await (window as any).aistudio?.hasSelectedApiKey();
    setHasApiKey(!!has);
  };

  const handleAuth = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasApiKey(true);
  };

  const handleFormSubmit = async (data: { image?: string; script: string; duration: Duration; language: Language }) => {
    setProductImage(data.image);
    setStoryboard(null);
    setScenes([]);
    
    setState({
      isProcessing: true,
      currentStep: 'blueprinting',
      progress: 5,
      message: 'Orchestrating Creative Brief...'
    });

    try {
      const blueprint = await adDirector.generateMasterBlueprint(data.script, data.duration, data.language);
      setStoryboard(blueprint);
      setState({
        isProcessing: false,
        currentStep: 'idle',
        progress: 100,
        message: 'Narrative Blueprint Approved'
      });
    } catch (error: any) {
      console.error("Blueprint Error:", error);
      const errorStr = JSON.stringify(error);
      const isAuthError = errorStr.includes("entity was not found") || error.message?.includes("AUTH_REQUIRED");
      const isQuotaError = errorStr.includes("429");

      if (isAuthError) setHasApiKey(false);
      
      setState({ 
        isProcessing: false, 
        currentStep: 'idle', 
        progress: 0, 
        message: isQuotaError ? 'API Quota Exhausted. Please wait 1-2 minutes.' : 'Brief Orchestration Error.' 
      });
    }
  };

  const handleConfirmStoryboard = async () => {
    if (!storyboard || state.isProcessing) return;

    setState({
      isProcessing: true,
      currentStep: 'producing',
      progress: 0,
      message: 'Initializing Production Loop...'
    });

    const producedScenes: AdScene[] = [];
    let prevExitContext = "";

    try {
      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i];
        
        setState(prev => ({ 
          ...prev, 
          message: `Directing Scene ${i + 1}/${storyboard.scenes.length}: ${DIRECTOR_MESSAGES[directorMsgIdx % DIRECTOR_MESSAGES.length]}`
        }));

        const [videoUrl, audioData] = await Promise.all([
          adDirector.generateContinuityVideo(
            scene, 
            storyboard.visualDNA, 
            prevExitContext, 
            scene.productFeatured ? productImage : undefined
          ),
          adDirector.generateNarration(scene.script, storyboard.targetLanguage)
        ]);

        const completedScene: AdScene = {
          ...scene,
          id: i,
          videoUrl,
          audioUrl: audioData.url,
          audioBuffer: audioData.buffer
        };

        producedScenes.push(completedScene);
        prevExitContext = scene.exitContext;
        
        setScenes([...producedScenes]);
        setState(prev => ({ ...prev, progress: ((i + 1) / storyboard.scenes.length) * 80 }));

        if (i < storyboard.scenes.length - 1) {
          setState(prev => ({ ...prev, message: "Production Cooldown: Clearing Quota Window..." }));
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      setState(prev => ({ 
        ...prev, 
        currentStep: 'committing', 
        message: 'COMMIT: ASSEMBLING MASTER CONTINUOUS CUT...',
        progress: 85
      }));

      const { videoUrl, audioUrl } = await videoRenderer.renderMasterAd(producedScenes);

      setState({
        isProcessing: false,
        currentStep: 'completed',
        progress: 100,
        message: 'MASTER COMMITTED: FINAL WEBMASTER READY.',
        finalVideoBlobUrl: videoUrl,
        finalAudioBlobUrl: audioUrl
      });
    } catch (err: any) {
      console.error("Production failure:", err);
      const errorStr = JSON.stringify(err);
      const isAuthError = errorStr.includes("entity was not found") || err.message?.includes("AUTH_REQUIRED");
      const isQuotaError = errorStr.includes("429");

      if (isAuthError) setHasApiKey(false);

      setState({ 
        isProcessing: false, 
        currentStep: 'idle', 
        progress: 0, 
        message: isQuotaError ? 'System Throttled: Quota exceeded. Please try again in a few minutes.' : 'Production Error.' 
      });
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] p-10 space-y-12">
        <div className="relative group">
           <div className="absolute -inset-8 bg-blue-600/20 blur-3xl group-hover:bg-blue-600/40 transition-all rounded-full"></div>
           <div className="relative w-32 h-32 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-6xl font-black shadow-4xl group-hover:scale-110 transition-all">h</div>
        </div>
        <div className="text-center space-y-4 max-w-sm">
           <h1 className="text-5xl font-black tracking-tighter uppercase">hApItech Studio</h1>
           <p className="text-white/30 text-xs font-bold uppercase tracking-[0.4em] leading-relaxed">Enterprise AI Video Generation Suite</p>
        </div>
        <button 
          onClick={handleAuth}
          className="px-16 py-7 bg-white text-black font-black rounded-3xl shadow-4xl hover:bg-neutral-100 active:scale-95 transition-all uppercase tracking-[0.4em] text-[10px]"
        >
          Authorize Production Access
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-blue-600/30">
      <Header />
      <main className="pt-36 pb-32 px-10 max-w-8xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-6">
               <span className="px-4 py-1.5 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-blue-600/20">System V3.4 Operational</span>
               <h2 className="text-7xl font-black tracking-tighter leading-[0.85] text-white">Direct the <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent italic">Narrative</span>.</h2>
               <p className="text-xl text-white/40 font-medium leading-relaxed">Full orchestration pipeline: Narrator, Visuals, SFX, Music, and Brand Logo Overlay.</p>
            </div>
            <AdForm onSubmit={handleFormSubmit} isLoading={state.currentStep === 'blueprinting'} />
          </div>
          
          <div className="lg:col-span-8 bg-[#080808] border border-white/5 rounded-[5rem] p-16 min-h-[800px] relative shadow-inner overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[200px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            {!storyboard && (
              <div className="h-full flex flex-col items-center justify-center space-y-10 text-center py-40">
                 <div className="w-24 h-24 border border-white/10 rounded-[2rem] flex items-center justify-center group hover:border-blue-600/50 transition-all duration-700">
                    <div className="w-3 h-3 bg-white/20 rounded-full group-hover:bg-blue-600 group-hover:scale-150 transition-all"></div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/10">Engine Standby</p>
                    <p className="text-xl font-medium text-white/20 max-w-xs italic text-center">Ready for creative orchestration.</p>
                 </div>
              </div>
            )}
            {storyboard && state.currentStep !== 'completed' && (
              <Storyboard 
                storyboard={storyboard} 
                producedScenes={scenes}
                onConfirm={handleConfirmStoryboard}
                isGeneratingClips={state.isProcessing}
                progress={state.progress}
              />
            )}
            {state.currentStep === 'completed' && storyboard && (
              <FinalPreview 
                scenes={scenes} 
                productName={storyboard.productName} 
                finalVideoUrl={state.finalVideoBlobUrl}
                finalAudioUrl={state.finalAudioBlobUrl}
              />
            )}
          </div>
        </div>
      </main>

      {state.isProcessing && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-10 z-50">
          <div className="bg-black/80 backdrop-blur-4xl p-10 rounded-[3rem] shadow-5xl border border-white/10 ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-5">
                 <div className="relative flex items-center justify-center">
                    <div className="absolute w-8 h-8 bg-blue-600/20 rounded-full animate-ping"></div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                 </div>
                 <span className="text-sm font-black uppercase tracking-[0.2em] leading-none text-white">{state.message}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white/30">{Math.round(state.progress)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-purple-600 transition-all duration-1000 rounded-full" 
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

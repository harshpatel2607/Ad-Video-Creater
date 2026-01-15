
export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi'
}

export enum Duration {
  SEC_20 = '20s',
  SEC_30 = '30s',
  SEC_40 = '40s',
  SEC_60 = '60s'
}

export interface VisualDNA {
  lighting: string;
  colorPalette: string;
  cameraLanguage: string;
  lensChoice: string;
  environmentTheme: string;
}

export interface AdScene {
  id: number;
  type: 'Hook' | 'Introduction' | 'Benefit' | 'Lifestyle' | 'Trust' | 'CTA';
  script: string;
  visualPrompt: string;
  duration: number;
  exitContext: string;
  productFeatured: boolean;
  videoUrl?: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
}

export interface LogoConfig {
  url: string;
  x: number;
  y: number;
  scale: number;
}

export interface AdStoryboard {
  productName: string;
  targetLanguage: Language;
  visualDNA: VisualDNA;
  masterNarration: string;
  scenes: AdScene[];
  musicVibe: string;
}

export interface AdGenerationState {
  isProcessing: boolean;
  currentStep: 'idle' | 'blueprinting' | 'producing' | 'committing' | 'completed';
  progress: number;
  message: string;
  finalVideoBlobUrl?: string;
  finalAudioBlobUrl?: string;
}

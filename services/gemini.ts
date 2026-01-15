
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, Duration, AdStoryboard, AdScene, VisualDNA } from "../types";

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 15000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isRateLimit = errorStr.includes("429") || error.status === 429 || error.message?.includes("429");
    
    if (isRateLimit && retries > 0) {
      console.warn(`Quota Exhausted (429). Waiting ${delay / 1000}s for window reset... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, delay));
      return callWithRetry(fn, retries - 1, delay + 10000);
    }
    throw error;
  }
}

export class AdDirectorService {
  private getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateMasterBlueprint(
    idea: string,
    duration: Duration,
    language: Language
  ): Promise<AdStoryboard> {
    const ai = this.getAi();
    const durationMap: Record<string, number> = { '20s': 20, '30s': 30, '40s': 40, '60s': 60 };
    const totalSeconds = durationMap[duration];
    const sceneCount = Math.min(6, Math.max(3, Math.floor(totalSeconds / 6)));

    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `YOU ARE A WORLD-CLASS ADVERTISING DIRECTOR. 
        CAMPAIGN IDEA: "${idea}".
        LANGUAGE: ${language}.
        DURATION: ${duration}.
        
        TASK: 
        1. Define Visual DNA (mood, lighting, camera).
        2. Write continuous professional narration.
        3. Plan ${sceneCount} scenes. 
        4. CRITICAL: Identify which scenes show the physical product (productFeatured: true). 
           - ONLY show the product in 40-60% of scenes. 
           - DO NOT show the product in every scene. 
           - If productFeatured is false, focus on environment, emotion, or abstract lifestyle.
        5. Choose a "Music Vibe" description (e.g., "Deep Cinematic Electronic", "Organic Acoustic Soul").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              musicVibe: { type: Type.STRING },
              visualDNA: {
                type: Type.OBJECT,
                properties: {
                  lighting: { type: Type.STRING },
                  colorPalette: { type: Type.STRING },
                  cameraLanguage: { type: Type.STRING },
                  lensChoice: { type: Type.STRING },
                  environmentTheme: { type: Type.STRING }
                },
                required: ['lighting', 'colorPalette', 'cameraLanguage', 'lensChoice', 'environmentTheme']
              },
              masterNarration: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['Hook', 'Introduction', 'Benefit', 'Lifestyle', 'Trust', 'CTA'] },
                    script: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    exitContext: { type: Type.STRING },
                    productFeatured: { type: Type.BOOLEAN }
                  },
                  required: ['type', 'script', 'visualPrompt', 'duration', 'exitContext', 'productFeatured']
                }
              }
            },
            required: ['productName', 'visualDNA', 'masterNarration', 'scenes', 'musicVibe']
          }
        }
      });
      return JSON.parse(response.text) as AdStoryboard;
    });
  }

  async generateContinuityVideo(
    scene: AdScene, 
    dna: VisualDNA, 
    previousExitContext?: string,
    lockedProductAsset?: string
  ): Promise<string> {
    const ai = this.getAi();
    
    // Explicitly check productFeatured to decide whether to use the asset
    const useAsset = scene.productFeatured && lockedProductAsset;

    const prompt = `
      TECHNICAL SPECS: ${dna.lighting}, ${dna.cameraLanguage}, ${dna.lensChoice}.
      SCENE DIRECTIVE: ${scene.visualPrompt}
      ${useAsset ? `[BRAND LOCK]: THE PRODUCT IN THE ATTACHED IMAGE IS THE STAR. RENDER IT ACCURATELY.` : `STRICT: DO NOT SHOW THE PRODUCT IMAGE OR THE PRODUCT ITSELF. Focus purely on environment and mood.`}
      CONTINUITY: ${previousExitContext ? `MATCH-CUT FROM: ${previousExitContext}` : 'OPENING SCENE.'}
    `;

    return await callWithRetry(async () => {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: useAsset ? {
          imageBytes: lockedProductAsset.split(',')[1],
          mimeType: 'image/png'
        } : undefined,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation yielded no result.");
      
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    });
  }

  async generateNarration(text: string, language: Language): Promise<{ url: string, buffer: AudioBuffer }> {
    const ai = this.getAi();
    const voiceName = language === Language.HINDI ? 'Kore' : 'Puck';

    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Act as a premium ad narrator. Voice this script with authority: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Narration generation failed");

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const uint8 = decode(base64Audio);
      const audioBuffer = await decodeAudioData(uint8, audioContext, 24000, 1);
      
      const blob = new Blob([uint8.buffer], { type: 'audio/pcm' });
      return { url: URL.createObjectURL(blob), buffer: audioBuffer };
    });
  }
}

export const adDirector = new AdDirectorService();

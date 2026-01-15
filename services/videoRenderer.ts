
import { AdScene, LogoConfig } from '../types';

/**
 * The Final Video Commit Controller (V3.5 - Cinematic Audio Mix)
 * Guarantees visual-audio synchronization with background music, SFX, and logo support.
 */
export class VideoRenderer {
  private async getSfx(ctx: AudioContext, type: 'whoosh' | 'impact'): Promise<AudioBuffer> {
    const duration = 0.8;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      if (type === 'whoosh') {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * Math.sin(t * 100);
      } else {
        // Impact for product featured scenes
        data[i] = Math.sin(t * 60) * Math.exp(-t * 15) * 0.5 + (Math.random() * 0.1);
      }
    }
    return buffer;
  }

  async renderMasterAd(scenes: AdScene[], logo?: LogoConfig): Promise<{ videoUrl: string, audioUrl: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!ctx) return reject("Canvas Render Context failed.");

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
        const dest = audioCtx.createMediaStreamDestination();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        // 1. Background Music Loop (Low Volume - 10%)
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.1; 
        musicGain.connect(dest);

        // Fetch cinematic background music
        const musicResponse = await fetch('https://cdn.pixabay.com/audio/2023/10/24/audio_333d9f1025.mp3').catch(() => null);
        if (musicResponse?.ok) {
          const musicArrayBuffer = await musicResponse.arrayBuffer();
          const musicBuffer = await audioCtx.decodeAudioData(musicArrayBuffer);
          const musicSource = audioCtx.createBufferSource();
          musicSource.buffer = musicBuffer;
          musicSource.loop = true;
          musicSource.connect(musicGain);
          musicSource.start(0);
        }

        // 2. Prepare Logo Asset
        let logoImg: HTMLImageElement | null = null;
        if (logo?.url) {
          logoImg = new Image();
          logoImg.src = logo.url;
          await new Promise((res) => { logoImg!.onload = res; });
        }

        const canvasStream = canvas.captureStream(30);
        const combinedStream = new MediaStream();
        canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
        dest.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
          ? 'video/webm;codecs=vp9,opus' 
          : 'video/mp4';
          
        const recorder = new MediaRecorder(combinedStream, { 
          mimeType,
          videoBitsPerSecond: 12000000,
          audioBitsPerSecond: 192000
        });

        const videoChunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunks.push(e.data); };
        recorder.onstop = () => {
          const videoBlob = new Blob(videoChunks, { type: mimeType });
          resolve({ videoUrl: URL.createObjectURL(videoBlob), audioUrl: '' });
        };

        recorder.start();

        const transitionSfx = await this.getSfx(audioCtx, 'whoosh');
        const productSfx = await this.getSfx(audioCtx, 'impact');

        for (const scene of scenes) {
          if (!scene.videoUrl || !scene.audioBuffer) continue;

          const video = document.createElement('video');
          video.src = scene.videoUrl;
          video.crossOrigin = "anonymous";
          video.muted = true;
          video.playsInline = true;

          await new Promise((res) => {
            video.oncanplaythrough = res;
            video.load();
          });

          // SFX Trigger
          const sfxSource = audioCtx.createBufferSource();
          sfxSource.buffer = scene.productFeatured ? productSfx : transitionSfx;
          const sfxGain = audioCtx.createGain();
          sfxGain.gain.value = 0.2;
          sfxSource.connect(sfxGain);
          sfxGain.connect(dest);
          sfxSource.start(audioCtx.currentTime);

          // Narration (Normal Volume)
          const voiceSource = audioCtx.createBufferSource();
          voiceSource.buffer = scene.audioBuffer;
          voiceSource.connect(dest);
          voiceSource.start(audioCtx.currentTime);

          await video.play();

          const durationMs = scene.duration * 1000;
          const startTime = performance.now();

          await new Promise<void>((res) => {
            const step = () => {
              const elapsed = performance.now() - startTime;
              
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              if (logoImg && logo) {
                const lWidth = logoImg.width * logo.scale;
                const lHeight = logoImg.height * logo.scale;
                ctx.drawImage(logoImg, logo.x, logo.y, lWidth, lHeight);
              }

              if (elapsed < durationMs) {
                requestAnimationFrame(step);
              } else {
                video.pause();
                voiceSource.stop();
                res();
              }
            };
            requestAnimationFrame(step);
          });
        }

        setTimeout(() => recorder.stop(), 1000);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const videoRenderer = new VideoRenderer();

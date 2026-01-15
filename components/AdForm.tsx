
import React, { useState } from 'react';
import { Language, Duration } from '../types';

interface AdFormProps {
  onSubmit: (data: {
    image?: string;
    script: string;
    duration: Duration;
    language: Language;
  }) => void;
  isLoading: boolean;
}

const AdForm: React.FC<AdFormProps> = ({ onSubmit, isLoading }) => {
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState<Duration>(Duration.SEC_30);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [image, setImage] = useState<string | undefined>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea) return;
    onSubmit({ image, script: idea, duration, language });
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-3xl">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
        <h2 className="text-3xl font-black tracking-tighter uppercase">Campaign Brief</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Locked Product Asset</label>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-blue-500 hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">Billing Info</a>
          </div>
          <div className="relative border-2 border-dashed border-white/10 rounded-3xl p-10 text-center hover:border-blue-500/50 hover:bg-white/[0.02] transition-all group cursor-pointer overflow-hidden">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {image ? (
              <img src={image} alt="Locked Product" className="max-h-64 mx-auto rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500" />
            ) : (
              <div className="py-8 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                  <svg className="w-8 h-8 text-white/40 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Register Brand Asset</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Mandatory for Consistency</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Campaign Creative Idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., A futuristic electric car driving through a neon cyber-city at night. High energy, sleek edits, and cinematic lighting."
            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 h-40 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-white resize-none font-medium leading-relaxed"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Production Time</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-600 transition-all appearance-none font-bold"
            >
              {Object.values(Duration).map(d => <option key={d} value={d} className="bg-[#0a0a0a] text-white">{d}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Narrator Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-600 transition-all appearance-none font-bold"
            >
              {Object.values(Language).map(l => <option key={l} value={l} className="bg-[#0a0a0a] text-white">{l}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !image}
          className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-3xl ${
            isLoading 
            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analyzing Strategy...</span>
            </div>
          ) : !image ? 'Register Asset First' : 'Generate Full Campaign'}
        </button>
      </form>
    </div>
  );
};

export default AdForm;

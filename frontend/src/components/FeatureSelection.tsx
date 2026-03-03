import React from 'react';

export enum FeatureType {
  NOVA_REEL = 'nova-reel',
  NOVA_IMAGE = 'nova-image'
}

interface FeatureSelectionProps {
  selectedFeature: FeatureType | null;
  setSelectedFeature: (feature: FeatureType) => void;
}

const FeatureSelection: React.FC<FeatureSelectionProps> = ({ setSelectedFeature }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">What would you like to create?</h2>
        <p className="text-slate-400 text-sm">Choose a generation mode to get started</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nova Reel */}
        <button
          onClick={() => setSelectedFeature(FeatureType.NOVA_REEL)}
          className="group text-left rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 p-6 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">Nova Reel</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Generate AI-powered videos from text prompts. Single clips, automated sequences, or fully custom multi-shot productions.
          </p>
          <div className="mt-4 flex items-center gap-1 text-amber-400 text-sm font-medium">
            Get started
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Nova Image — coming soon */}
        <div className="relative rounded-2xl bg-slate-800/30 border border-slate-800 p-6 opacity-60 cursor-not-allowed">
          <div className="absolute top-3 right-3 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Coming soon
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-slate-400 font-semibold mb-1">Nova Image</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            AI-powered image generation from text descriptions using Amazon Nova.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureSelection;

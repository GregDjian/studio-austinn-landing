import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'initial' | 'fading' | 'hidden'>('initial');

  useEffect(() => {
    // Sequence of animations
    const timer1 = setTimeout(() => {
      setStage('fading');
    }, 2000); // Show logo for 2 seconds

    const timer2 = setTimeout(() => {
      setStage('hidden');
      onComplete();
    }, 3000); // Total time 3 seconds (1s for slide up)

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-stone-50 transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        stage === "fading" ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex flex-col items-center leading-none">
        {/* Studio (safe to clip for reveal) */}
        <div className="overflow-hidden mb-2">
          <h1 className="font-sans font-black text-4xl md:text-6xl uppercase tracking-tighter text-stone-900 animate-fade-in-up">
            Studio
          </h1>
        </div>

        {/* Austinn (do NOT clip, add breathing room so full height shows) */}
        <div className="pb-2">
          <h1
            className="font-script text-5xl md:text-7xl text-stone-500 animate-fade-in-up leading-tight"
            style={{ animationDelay: "0.2s" }}
          >
            Austinn
          </h1>
        </div>

        {/* Loading Line */}
        <div className="mt-8 w-32 h-[1px] bg-stone-200 overflow-hidden">
          <div className="w-full h-full bg-stone-900 animate-[drift_2s_infinite]"></div>
        </div>
      </div>
    </div>

  );
};

export default Preloader;
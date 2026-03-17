import React, { useEffect, useState } from 'react';
import { Language } from '../types';


interface PreloaderProps {
  onComplete: () => void;
  lang: Language;
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
        {/* Studio logo */}
        <div className="overflow-hidden mb-0 animate-fade-in-up">
          <img src="/logo/openStudio.png" alt="Studio" className="h-60 md:h-60 w-auto" draggable={false} />
        </div>

        {/* Austinn logo */}
        <div className="-mt-60 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <img src="/logo/openAustinn.png" alt="Austinn" className="h-60 md:h-60 w-auto" draggable={false} />
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
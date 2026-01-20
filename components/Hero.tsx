import React, { useEffect, useRef } from 'react';
import { Language } from '../types';

const Hero: React.FC<{ lang: Language }> = ({ lang }) => {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);
  const cloud3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
      const yPos = (e.clientY / window.innerHeight - 0.5) * 2;
      if (cloud1Ref.current) cloud1Ref.current.style.transform = `translate(${xPos * -30}px, ${yPos * -30}px)`;
      if (cloud2Ref.current) cloud2Ref.current.style.transform = `translate(${xPos * 40}px, ${yPos * 40}px)`;
      if (cloud3Ref.current) cloud3Ref.current.style.transform = `translate(${xPos * -20}px, ${yPos * -15}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#f0f9ff]">
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white to-sky-50"></div>
         <div ref={cloud1Ref} className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] transition-transform duration-[2000ms] ease-out will-change-transform">
            <div className="w-full h-full bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-drift"></div>
         </div>
         <div ref={cloud2Ref} className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] transition-transform duration-[2500ms] ease-out will-change-transform">
            <div className="w-full h-full bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[100px] animate-drift-slow"></div>
         </div>
         <div ref={cloud3Ref} className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] transition-transform duration-[3000ms] ease-out will-change-transform">
            <div className="w-full h-full bg-stone-100/60 rounded-full mix-blend-multiply filter blur-[60px] animate-float"></div>
         </div>
      </div>

      <div ref={parallaxRef} className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 will-change-transform">
        <div className="relative text-center">
            <p className="font-sans text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-stone-500 mb-8 animate-blur-in opacity-0" style={{animationDelay: '0.2s'}}>
                {lang === 'en' ? 'The Sky is the Canvas' : 'السماء هي اللوحة'}
            </p>
            <h1 className="flex flex-col items-center leading-[0.85] tracking-tighter font-sans font-black text-stone-900 mix-blend-darken">
                <span className="text-[14vw] md:text-[13vw] opacity-0 animate-blur-in" style={{animationDelay: '0.4s'}}>STUDIO</span>
                <span className="text-[14vw] md:text-[13vw] opacity-0 animate-blur-in" style={{animationDelay: '0.6s'}}>AUSTINN</span>
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] mix-blend-overlay opacity-0 animate-blur-in" style={{animationDelay: '1s'}}>
               <p className="font-script text-[14vw] md:text-[10vw] text-blue-900/10 -rotate-3 translate-y-4">
                 {lang === 'en' ? 'Purist' : 'نقاء'}
               </p>
            </div>
        </div>
        <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-0 animate-fade-in-up" style={{animationDelay: '1.4s'}}>
            <div className="w-[1px] h-12 bg-stone-300"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {lang === 'en' ? 'Explore' : 'اكتشف'}
            </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-stone-50 to-transparent z-20"></div>
    </section>
  );
};

export default Hero;
import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${clientX}px`;
        dotRef.current.style.top = `${clientY}px`;
      }
      
      if (outlineRef.current) {
        outlineRef.current.animate({
          left: `${clientX}px`,
          top: `${clientY}px`
        }, { duration: 500, fill: 'forwards' });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div className="hidden md:block mix-blend-difference text-white pointer-events-none">
      <div ref={dotRef} className="cursor-dot bg-white fixed w-2 h-2 rounded-full z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" />
      <div ref={outlineRef} className="cursor-outline border border-white fixed w-10 h-10 rounded-full z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out" />
    </div>
  );
};

export default CustomCursor;
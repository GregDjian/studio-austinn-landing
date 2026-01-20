import React from 'react';

const Philosophy: React.FC = () => {
  return (
    <section id="philosophy" className="relative py-32 md:py-48 bg-stone-50 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-stone-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-32">
            
            {/* Left Column - Sticky Title & Founder Profile */}
            <div className="md:w-5/12 relative">
                <div className="sticky top-32">
                    {/* Editorial Title */}
                    <div className="relative mb-12">
                         <span className="font-script text-8xl md:text-9xl text-stone-300 absolute -top-14 -left-6 z-0 opacity-60 mix-blend-multiply select-none">Behind</span>
                         <h2 className="relative z-10 font-sans font-black text-6xl md:text-7xl leading-[0.85] text-stone-900 uppercase tracking-tighter">
                            The <br/> Canvas
                         </h2>
                    </div>
                    
                    {/* Founder Image */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm shadow-2xl shadow-stone-200/50 group">
                         <img 
                            src="https://images.unsplash.com/photo-1544208849-0d321526487e?q=80&w=2600&auto=format&fit=crop" 
                            alt="Marine Bordier-Cros - Founder" 
                            className="w-full h-full object-cover filter grayscale contrast-125 transition-all duration-[1.5s] ease-out group-hover:grayscale-0 group-hover:scale-105"
                         />
                         
                         {/* Name Badge */}
                         <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-6 py-4 border border-white/50 shadow-sm text-right">
                            <p className="font-serif italic text-stone-900 text-lg leading-none mb-1">Marine Bordier-Cros</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Founder</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Narrative Flow */}
            <div className="md:w-6/12 pt-12 md:pt-40 space-y-12">
                
                {/* Introduction */}
                <div className="group">
                    <p className="font-serif text-2xl md:text-3xl leading-relaxed text-stone-800 mb-8 transition-colors duration-500 group-hover:text-stone-900">
                        "Art has always been at the heart of my life. My journey began with studies in art history & archaeology, giving me a deep appreciation for the stories art can tell."
                    </p>
                    <div className="h-[2px] w-12 bg-stone-900 mb-8 group-hover:w-32 transition-all duration-700 ease-out"></div>
                    {/*<p className="font-sans text-sm font-medium text-stone-500 leading-loose max-w-md text-justify">
                        I further expanded my expertise with a Business School Education in management, equipping me with the skills to turn my creative passion into a thriving art consultancy.
                    </p>*/}
                </div>

                {/* Made in UAE Feature Card */}
                <div className="">
                    {/* Decorative Blob */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                     <div className="relative z-10">
                        <div className="flex items-baseline gap-4 mb-4">
                            <h3 className="font-script text-6xl text-stone-400">Made</h3>
                            <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900">In U.A.E.</h2>
                        </div>
                        
                        <p className="font-serif text-md text-stone-700 leading-relaxed mb-8">
                           Located in the heart of <strong className="text-stone-900">Al Quoz</strong>, our studio is where creativity takes shape. We collaborate with skilled artisans and local suppliers to ensure exceptional craftsmanship.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square bg-stone-200 rounded-sm overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Workshop details" />
                            </div>
                            <div className="aspect-square bg-stone-200 rounded-sm overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1605218427368-35b0185e49f7?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Materials" />
                            </div>
                        </div>
                     </div>
                </div>

                {/* Closing Statement */}
                <div className="flex flex-col items-start gap-10">
                     <p className="font-serif text-xl leading-loose text-stone-800 border-l-2 border-sky-200 pl-6">
                        "Studio Austinn is a reflection of devotion to art and its power to inspire. My aim is to make art accessible, transformative, and unforgettable."
                     </p>
                     
                     {/* Signature */}
                     <div className="mt-4">
                        <p className="font-script text-6xl text-stone-900 transform -rotate-2">Marine Bordier-Cros</p>
                     </div>
                </div>

            </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
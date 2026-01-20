import React, { useState } from 'react';

interface Sector {
  title: string;
  category: string;
  image: string;
  description: string;
}

const sectors: Sector[] = [
  {
    title: 'Private Villas',
    category: 'Residential',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
    description: 'Bespoke art installations tailored for the most exclusive residences in the UAE.'
  },
  {
    title: 'Hospitality',
    category: 'Hotels & Resorts',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop',
    description: 'Transforming guest experiences with statement sculptures and curated galleries.'
  },
  {
    title: 'Gastronomy',
    category: 'Restaurants',
    image: 'https://images.unsplash.com/photo-1550966841-3ee4ad6b107c?q=80&w=2000&auto=format&fit=crop',
    description: 'Enhancing culinary narratives through atmospheric art and lighting.'
  },
  {
    title: 'Design Partners',
    category: 'Architects',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop',
    description: 'Collaborating with world-class architects to integrate art from the blueprint phase.'
  },
  {
    title: 'Luxury Retail',
    category: 'Malls & Boutiques',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop',
    description: 'Creating immersive brand experiences through artistic commerce.'
  },
  {
    title: 'Public Spaces',
    category: 'Civic & Corporate',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop',
    description: 'Large-scale installations that redefine public landscapes and workspaces.'
  }
];

const Environments: React.FC = () => {
  const [activeSector, setActiveSector] = useState<number | null>(null);

  return (
    <section id="spaces" className="py-24 bg-stone-100 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div className="max-w-2xl">
            <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-stone-400 mb-4">
            Ecosystem
            </h3>

            <h2 className="font-sans font-black text-5xl md:text-7xl uppercase tracking-tighter text-stone-900 leading-none text-left">
            Where Art <br />
            <span className="text-stone-400">Resides</span>
            </h2>
        </div>

        <div className="text-left md:text-right">
            <p className="font-serif italic text-xl text-stone-600 max-w-sm">
            From intimate private sanctuaries to expansive public landmarks.
            </p>
        </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {sectors.map((sector, index) => (
            <div 
              key={index}
              className="relative aspect-[4/3] group overflow-hidden bg-stone-200 cursor-crosshair"
              onMouseEnter={() => setActiveSector(index)}
              onMouseLeave={() => setActiveSector(null)}
            >
              {/* Background Image */}
              <img 
                src={sector.image} 
                alt={sector.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 ${activeSector === index ? 'opacity-100' : 'opacity-40'}`}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-stone-900/40 group-hover:bg-stone-900/10 transition-colors duration-700"></div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                  {sector.category}
                </span>
                <h3 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tighter group-hover:-translate-y-2 transition-transform duration-500">
                  {sector.title}
                </h3>
                
                <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                  <p className="font-serif italic text-sm mt-4 text-stone-100 leading-relaxed max-w-[250px]">
                    {sector.description}
                  </p>
                </div>
              </div>

              {/* Index Number */}
              <div className="absolute top-8 right-8 text-xs font-bold font-sans tracking-widest opacity-30 text-white">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Closing Partner Note */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale group hover:grayscale-0 transition-all duration-1000">
           <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">Architects</span>
           <span className="w-1 h-1 bg-stone-400 rounded-full"></span>
           <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">Developers</span>
           <span className="hidden md:inline-block w-1 h-1 bg-stone-400 rounded-full"></span>
           <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">Designers</span>
           <span className="w-1 h-1 bg-stone-400 rounded-full"></span>
           <span className="font-sans font-bold text-[10px] uppercase tracking-[0.4em]">Proprietors</span>
        </div>
      </div>
    </section>
  );
};

export default Environments;
import React, { useEffect, useState } from "react";
import { X, ArrowUpRight, MapPin } from "lucide-react";
import { Language } from "../types";
import ProjectDetail from "./ProjectDetail";

export interface Project {
  id: string;
  title: string;
  location: string;
  year: string;
  size: string;
  summary: string;
  cover: string;
  images: string[];
  tags: string[];
}

export interface Sector {
  title: string;
  category: string;
  image: any;
  description: string;
  projects: Project[];
}

const getContent = (lang: Language) => {
  if (lang === "ar") {
    return {
      close: "إغلاق",
      projects: "مشاريع",
      noProjects: "لا توجد مشاريع في هذا القسم حتى الآن.",
    };
  }
  return {
    close: "Close",
    projects: "Projects",
    noProjects: "No projects yet in this category.",
  };
};

interface SectorModalProps {
  sector: Sector;
  onClose: () => void;
  lang: Language;
}

const getImgSrc = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && typeof img.src === "string") return img.src;
  if (typeof img === "object" && typeof img.default === "string") return img.default;
  return String(img);
};

const SectorModal: React.FC<SectorModalProps> = ({ sector, onClose, lang }) => {
  const t = getContent(lang);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (activeProject) {
    return <ProjectDetail project={activeProject} onClose={() => setActiveProject(null)} lang={lang} />;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-stone-50 animate-fade-in-up"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Hero banner */}
      <div className="relative h-[40vh] md:h-[45vh] shrink-0 overflow-hidden">
        <img src={getImgSrc(sector.image)} alt={sector.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-stone-50" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all"
          aria-label={t.close}
        >
          <X size={20} className="text-white" />
        </button>

        <div className="absolute bottom-8 left-8 md:left-12">
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-2">{sector.category}</p>
          <h2 className="font-sans font-black text-5xl md:text-7xl uppercase tracking-tighter text-white leading-none">
            {sector.title}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto">

          <p className="font-serif italic text-stone-500 text-lg md:text-xl max-w-2xl mb-12">
            {sector.description}
          </p>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">{t.projects}</span>
            <span className="h-[1px] flex-1 bg-stone-200" />
            <span className="text-[10px] font-bold text-stone-400">{sector.projects.length}</span>
          </div>

          {sector.projects.length === 0 ? (
            <p className="text-stone-400 text-sm uppercase tracking-widest py-20 text-center">{t.noProjects}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sector.projects.map((project, i) => (
                <div
                  key={project.id}
                  className="group cursor-pointer"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => setActiveProject(project)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] mb-4 bg-stone-200">
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <ArrowUpRight size={18} className="text-stone-900" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded text-[9px] font-bold uppercase tracking-widest text-stone-700">
                      {project.year}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-sans font-black text-xl uppercase tracking-tighter text-stone-900 group-hover:text-stone-500 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-stone-400 text-[11px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {project.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-stone-100 text-stone-500 text-[8px] font-bold uppercase tracking-wider rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectorModal;
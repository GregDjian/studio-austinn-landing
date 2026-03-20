import React, { useState } from "react";
import { X, ArrowLeft, ArrowRight, ArrowUpRight, MapPin, Calendar, Ruler } from "lucide-react";
import { Language } from "../types";
import { Project } from "./SectorModal";

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
  lang: Language;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, lang }) => {
  const [activeImg, setActiveImg] = useState(0);

  const prev = () => setActiveImg((p) => (p - 1 + project.images.length) % project.images.length);
  const next = () => setActiveImg((p) => (p + 1) % project.images.length);

  return (
    <div
      className="fixed inset-0 z-[130] bg-stone-950 flex flex-col animate-fade-in-up"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {lang === "ar" ? "رجوع" : "Back"}
        </button>

        <div className="hidden md:flex gap-2 flex-wrap justify-center">
          {project.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 border border-white/20 text-white/50 text-[9px] font-bold uppercase tracking-widest rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-full lg:h-full">

          {/* Left: Images */}
          <div className="relative bg-stone-900 flex flex-col">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1 overflow-hidden">
              <img
                key={activeImg}
                src={project.images[activeImg]}
                alt={project.title}
                className="w-full h-full object-cover animate-fade-in-up"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent pointer-events-none" />

              {project.images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all">
                    <ArrowLeft size={16} />
                  </button>
                  <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all">
                    <ArrowRight size={16} />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-white/50">
                {activeImg + 1} / {project.images.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 p-4 bg-stone-950 shrink-0">
              {project.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-12 overflow-hidden rounded transition-all duration-300 ${
                    activeImg === i ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="bg-stone-950 px-8 md:px-14 py-12 flex flex-col justify-between min-h-full">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                {project.year}
              </p>

              <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-white leading-none mb-8">
                {project.title}
              </h2>

              {/* Meta */}
              <div className="grid grid-cols-1 gap-4 mb-10 border-t border-b border-white/10 py-6">
                <div className="flex items-center gap-3 text-white/60">
                  <MapPin size={14} className="shrink-0 text-white/30" />
                  <span className="text-sm">{project.location}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Calendar size={14} className="shrink-0 text-white/30" />
                  <span className="text-sm">{project.year}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Ruler size={14} className="shrink-0 text-white/30" />
                  <span className="text-sm">{project.size}</span>
                </div>
              </div>

              <p className="font-serif italic text-white/70 text-base md:text-lg leading-relaxed mb-6 flex-1">
                "{project.summary}"
              </p>

              {/* Tags — mobile only */}
              <div className="flex md:hidden flex-wrap gap-2 mb-10">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 border border-white/20 text-white/50 text-[9px] font-bold uppercase tracking-widest rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <a
              href="#contact"
              onClick={onClose}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-stone-200 transition-colors self-start"
            >
              {lang === "ar" ? "استفسر عن هذا المشروع" : "Inquire About This Project"}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
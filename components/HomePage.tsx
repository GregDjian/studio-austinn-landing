import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Language } from "../types";
import Hero from "./Hero";
import Philosophy from "./Philosophy";
import LatestPieces from "./LatestPieces";
import Services from "./Services";
import FeaturedArtist from "./FeaturedArtist";
import Environments from "./Environment";
import Contact from "./Contact";

const HomePage: React.FC<{ lang: Language }> = ({ lang }) => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Hero lang={lang} />
      <Philosophy lang={lang} />
      <LatestPieces lang={lang} />
      <Services lang={lang} />
      <FeaturedArtist lang={lang} />
      <Environments lang={lang} />
      <Contact lang={lang} />
    </>
  );
};

export default HomePage;

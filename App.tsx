import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Services from './components/Services';
import FeaturedArtist from './components/FeaturedArtist';
import Environments from './components/Environment';
import Contact from './components/Contact';
import ChatWidget from './components/ChatWidget';
import Preloader from './components/Preloader';
import { Language } from './types';

function App() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <main className={`w-full relative ${lang === 'ar' ? 'font-sans' : ''}`}>
      <div className="bg-noise"></div>
      
      <Preloader onComplete={() => setLoading(false)} lang={lang} />
      
      <Header lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <Philosophy lang={lang} />
      <Services lang={lang} />
      <FeaturedArtist lang={lang} />
      <Environments lang={lang} />
      <Contact lang={lang} />
      <ChatWidget lang={lang} />
    </main>
  );
}

export default App;
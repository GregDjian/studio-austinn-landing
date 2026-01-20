import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Services from './components/Services';
import FeaturedArtist from './components/FeaturedArtist';
import Contact from './components/Contact';
import ChatWidget from './components/ChatWidget';
import Preloader from './components/Preloader';
import Environments from './components/Environment';

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <main className="w-full relative">
      <div className="bg-noise"></div>
      
      <Preloader onComplete={() => setLoading(false)} />
      
      <Header />
      <Hero />
      <Philosophy />
      <Services />
      <FeaturedArtist />
      <Environments/>
      <Contact />
      <ChatWidget />
    </main>
  );
}

export default App;
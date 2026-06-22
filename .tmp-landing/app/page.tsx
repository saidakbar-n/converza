'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Check, ArrowRight, Hexagon, Database, Terminal, Settings, Server, GitBranch, Share2
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-void relative selection:bg-accent selection:text-white font-sans text-text-dark">
      {/* Expansive Workspace Grid */}
      <div className="absolute inset-0 bg-grid-workspace opacity-100 z-0 pointer-events-none" />
      
      {/* Navigation Layer */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-surface-edge rounded-full shadow-sm w-11/12 max-w-5xl px-2 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 pl-4">
          <div className="w-5 h-5 bg-accent text-white flex items-center justify-center rounded-sm">
             <Hexagon className="w-3 h-3" fill="currentColor" />
          </div>
          <span className="font-sans font-[700] tracking-tight text-[15px] text-text-dark">Converza</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-sans text-[13px] font-[500] text-slate">
          <a href="#proof" className="hover:text-text-dark transition-silky">Infrastructure</a>
          <a href="#how-it-works" className="hover:text-text-dark transition-silky">Protocol</a>
          <a href="#benefits" className="hover:text-text-dark transition-silky">Capabilities</a>
        </div>
        <div className="pr-1">
          <a href="#pilot" className="bg-accent text-white hover:bg-accent-hover px-6 py-2.5 font-sans justify-center text-[13px] font-[600] rounded-full transition-silky shadow-sm flex items-center group">
            Book Pilot <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </nav>

      {/* SECTION 1: Above The Fold */}
      <section className="relative z-10 pt-44 pb-32 px-6 max-w-[1400px] mx-auto min-h-[90vh] flex items-center">
        <div className="grid lg:grid-cols-12 gap-16 items-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start lg:col-span-6 xl:col-span-5"
          >
             {/* Pill Tag */}
             <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-surface-edge rounded-full bg-white font-mono text-[11px] font-[600] text-text-dark uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 bg-accent animate-ping rounded-full absolute" />
              <span className="w-2 h-2 bg-accent rounded-full relative z-10" />
              System Online: 19 Nodes
            </div>
            
            <h1 className="text-[52px] md:text-[72px] font-[700] tracking-tighter leading-[1.0] mb-6 text-text-dark font-sans flex flex-col">
              <span>Replace the</span>
              <span className="font-serif italic text-accent font-[400] text-[58px] md:text-[84px] ml-[-4px]">Marketing<br/>Agency.</span>
            </h1>
            
            <p className="font-sans text-[18px] text-slate-light font-[500] mb-10 leading-[1.6] max-w-md">
              Target international markets with native-English campaigns. Do it without hiring freelancers, managing editors, or writing scripts. <span className="text-text-dark font-[600]">No human management required.</span>
            </p>

            <div className="flex flex-col w-full sm:w-auto">
              <a href="#pilot" className="group bg-text-dark text-white font-sans font-[600] text-[15px] px-8 py-5 rounded-[2rem] flex items-center justify-between gap-6 transition-silky hover:bg-black hover:scale-[1.02] shadow-md border border-transparent overflow-hidden relative">
                <span className="relative z-10">Book Your $500 Pilot</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transform transition-silky relative z-10" />
              </a>
              <div className="flex items-center gap-6 mt-6 font-mono text-[11px] uppercase tracking-widest text-slate font-[500]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span>Keep assets</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Image Brutalist Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-6 xl:col-span-7 relative w-full aspect-square md:aspect-[4/3] bg-surface-elevated border border-surface-edge rounded-[2rem] md:rounded-[3rem] p-4 flex flex-col shadow-xl"
          >
             <div className="w-full h-full relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-surface">
                {/* Image matching industrial/brutalist but bright */}
                <Image 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
                  alt="Industrial Infrastructure"
                  fill
                  className="object-cover grayscale opacity-90"
                  referrerPolicy="no-referrer"
                />
                {/* Gradient overlay to ensure brutalist bright feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                
                {/* Decorative floating UI elements representing nodes */}
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                   <div className="bg-white/90 backdrop-blur-md border border-surface-edge p-4 rounded-2xl shadow-lg w-64">
                      <div className="font-mono text-[10px] text-slate uppercase tracking-widest mb-2">Node 04 / Rendering</div>
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-3/4 animate-pulse" />
                      </div>
                   </div>
                   
                   <div className="bg-accent text-white p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-4 border-white">
                      <Server className="w-6 h-6" />
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: Features - Diagnostic Shuffler, Telemetry Typewriter, Cursor Protocol Scheduler */}
      <section id="proof" className="relative z-10 py-32 bg-surface-elevated border-y border-surface-edge">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-[40px] md:text-[56px] font-[700] tracking-tighter text-text-dark leading-[1.0] max-w-2xl font-sans">
              Algorithms don&apos;t complain about revisions.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <DiagnosticShuffler />
            <TelemetryTypewriter />
            <CursorScheduler />
          </div>
        </div>
      </section>

      {/* SECTION 3: Philosophy */}
      <section id="how-it-works" className="relative z-10 py-40 max-w-[1400px] mx-auto px-6">
        <div className="relative bg-text-dark text-white rounded-[3rem] p-12 md:p-24 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80')] opacity-10 object-cover mix-blend-overlay" />
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-12 text-center">
            <p className="font-sans text-[20px] md:text-[24px] text-white/50 font-[500] leading-tight">
              Most e-commerce brands focus on:<br/>
              <span className="text-white">managing chaotic creative teams.</span>
            </p>
            <h3 className="font-sans flex flex-col items-center">
              <span className="text-[32px] md:text-[40px] font-[700] mb-[-10px]">We focus on:</span>
              <span className="font-serif italic text-accent font-[400] text-[64px] md:text-[110px] leading-[1]">algorithmic deployment.</span>
            </h3>
          </div>
        </div>
      </section>

      {/* SECTION 4: Sticky Protocol (Stacking Archive) */}
      <ProtocolArchive />

      {/* SECTION 5: The Final Pitch */}
      <section id="pilot" className="relative z-10 py-32 max-w-5xl mx-auto px-6 flex justify-center">
        <div className="bg-surface border border-surface-edge rounded-[3rem] p-12 lg:p-24 w-full flex flex-col items-center text-center relative shadow-sm overflow-hidden">
          <div className="font-mono text-accent text-[11px] font-[600] uppercase tracking-widest rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-10 inline-flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
             Q3 Market Access Waitlist
          </div>
          
          <h2 className="text-[44px] md:text-[56px] font-[700] tracking-tighter mb-8 text-text-dark leading-[1.0] max-w-2xl font-sans">
            Stop paying US agencies to learn on your dime.
          </h2>
          
          <p className="text-[17px] text-slate-light mb-14 max-w-xl leading-[1.6]">
            We are opening our Q3 onboarding exclusively for E-commerce founders in the CIS and Uzbekistan markets. Skip the trial and error. Let the protocol scale you.
          </p>

          <button className="bg-accent text-white font-[600] text-[16px] px-10 py-5 rounded-[2rem] transition-silky hover:bg-accent-hover hover:scale-[1.03] shadow-md flex items-center gap-2">
            Secure Your Spot <ArrowRight className="w-5 h-5"/>
          </button>
          
          <div className="font-mono text-[11px] uppercase tracking-widest text-slate-light mt-8 font-[500]">
            Flat $500 pilot. Cancel anytime.
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 bg-text-dark text-white py-12 px-6 rounded-t-[3rem] w-[calc(100%-2rem)] mx-auto mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-accent text-white flex items-center justify-center rounded-sm">
              <Hexagon className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-sans font-[700] tracking-tight text-[16px] text-white">Converza</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
            <span className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse" />
            System Operational
          </div>
          <p className="font-mono text-[10px] font-[400] text-white/40 uppercase tracking-widest">
            © {new Date().getFullYear()} Converza Systems. Engineered for Scale.
          </p>
        </div>
      </footer>
    </main>
  );
}

// -------------------------------------------------------------
// Interactive Feature Components
// -------------------------------------------------------------

function DiagnosticShuffler() {
  const [cards, setCards] = useState([
    { id: 1, title: 'Node 01: Context Ingestion', status: 'ACTIVE' },
    { id: 2, title: 'Node 08: Video Processing', status: 'SYNCHING' },
    { id: 3, title: 'Node 19: Global Distribution', status: 'READY' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        if (last) newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-surface-edge rounded-[2rem] p-8 flex flex-col shadow-sm h-[400px]">
      <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-6 bg-accent/5 px-3 py-1 rounded inline-block w-fit">Component // 01</div>
      <h3 className="font-[700] text-[22px] tracking-tight mb-2">Deploy a 19-node autonomous marketing swarm.</h3>
      <p className="text-[14px] text-slate-light mb-8">Access dedicated compute clusters trained exclusively on direct-response frameworks.</p>
      
      <div className="relative flex-1 flex items-end justify-center pb-4">
        <AnimatePresence>
          {cards.map((card, i) => {
            const isTop = i === 2;
            const isMid = i === 1;
            
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: isTop ? 1 : isMid ? 0.8 : 0.4, 
                  y: isTop ? 0 : isMid ? -15 : -30,
                  scale: isTop ? 1 : isMid ? 0.95 : 0.9,
                  zIndex: i
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute w-full max-w-[280px] bg-void border border-surface-edge rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <Database className="w-4 h-4 text-slate" />
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-widest ${isTop ? 'bg-accent/10 text-accent' : 'bg-surface text-slate'}`}>
                    {card.status}
                  </span>
                </div>
                <div className="font-sans font-[600] text-[13px]">{card.title}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TelemetryTypewriter() {
  const [text, setText] = useState("");
  const fullText = "SYS.COMMAND\n> Init generation bounds\n[OK] Applying winning frameworks\n> Generating 60 assets\n[████████░░] 80%\n> EST. Completion: 24h\n\nSTATUS: ONLINE";

  useEffect(() => {
    let current = 0;
    let interval: NodeJS.Timeout;
    
    const startTyping = () => {
      current = 0;
      setText("");
      interval = setInterval(() => {
        setText(fullText.slice(0, current));
        current++;
        if (current > fullText.length) {
          clearInterval(interval);
          setTimeout(() => { startTyping(); }, 4000);
        }
      }, 40);
    };

    startTyping();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-text-dark text-white border border-surface-edge rounded-[2rem] p-8 flex flex-col shadow-xl h-[400px]">
      <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-6 bg-accent/20 px-3 py-1 rounded inline-block w-fit">Component // 02</div>
      <h3 className="font-[700] text-[22px] tracking-tight mb-2">Generate 60 high-volume video ads in 24 hours.</h3>
      <p className="text-[14px] text-slate mb-8">Feed the machine raw assets and receive polished, converted, native-English hooks daily.</p>
      
      <div className="flex-1 bg-[#111111] rounded-xl p-5 border border-white/10 font-mono text-[11px] text-[#00FF00] leading-relaxed whitespace-pre-wrap relative overflow-hidden">
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse" />
          <span className="text-[9px] text-[#00FF00]/50 tracking-widest">LIVE FEED</span>
        </div>
        {text}
        <span className="inline-block w-2 h-[1em] bg-[#00FF00] animate-pulse ml-1 align-middle" />
      </div>
    </div>
  );
}

function CursorScheduler() {
  const cursorRef = useRef(null);
  const containerRef = useRef(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    
    // Starting pos
    tl.set(cursorRef.current, { x: 10, y: 10, opacity: 0 })
      .to(cursorRef.current, { opacity: 1, duration: 0.3 })
      // Move to Day 3 (Wednesday)
      .to(cursorRef.current, { x: 110, y: 35, duration: 0.8, ease: "power2.inOut" })
      // Click
      .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
      .call(() => setActiveDay(2)) // 0-indexed
      .to(cursorRef.current, { scale: 1, duration: 0.1 })
      // Move to Save button
      .to(cursorRef.current, { x: 220, y: 120, duration: 0.8, ease: "power2.inOut" })
      // Click Save
      .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
      .to(cursorRef.current, { scale: 1, duration: 0.1 })
      // Fade out
      .to(cursorRef.current, { opacity: 0, duration: 0.3 })
      .call(() => setActiveDay(null));
  }, { scope: containerRef });

  return (
    <div className="bg-white border border-surface-edge rounded-[2rem] p-8 flex flex-col shadow-sm h-[400px]">
      <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-6 bg-accent/5 px-3 py-1 rounded inline-block w-fit">Component // 03</div>
      <h3 className="font-[700] text-[22px] tracking-tight mb-2">Eliminate human latency & retail retainers.</h3>
      <p className="text-[14px] text-slate-light mb-8">Skip the feedback slack threads. Algorithmic scheduling auto-deploys approved assets.</p>
      
      <div ref={containerRef} className="flex-1 bg-surface rounded-xl p-4 border border-surface-edge relative flex flex-col items-center justify-center">
        {/* Weekly Grid */}
        <div className="grid grid-cols-7 gap-1 w-full max-w-[240px] mb-6">
          {['S','M','T','W','T','F','S'].map((day, i) => (
            <div key={i} className="flex flex-col gap-1 items-center">
              <div className="font-mono text-[8px] text-slate uppercase">{day}</div>
              <div className={`w-full aspect-square rounded-sm border border-surface-edge transition-colors duration-300 ${activeDay === i ? 'bg-accent border-accent shadow-sm shadow-accent/20' : 'bg-void'}`} />
            </div>
          ))}
        </div>
        
        {/* Save Button */}
        <div className="w-full max-w-[240px] bg-text-dark text-white text-center py-2 rounded-md font-mono text-[9px] uppercase tracking-widest">
          Deploy Schedule
        </div>

        {/* The SVG Cursor */}
        <div ref={cursorRef} className="absolute top-0 left-0 text-text-dark pointer-events-none drop-shadow-md z-10 w-fit">
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L11.5 31.5L15 18.5L23.5 13L1 1Z" fill="#111111" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Protocol Section (GSAP Pinning Archive)
// -------------------------------------------------------------

function ProtocolArchive() {
  const sectionRef = useRef(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Only set up ScrollTrigger if not on mobile for smoother experience
    if (window.innerWidth > 768) {
      cardsRef.current.forEach((card, i) => {
        if (i === cardsRef.current.length - 1) return; // Skip last card
        
        ScrollTrigger.create({
          trigger: card,
          start: "top 20%",
          endTrigger: cardsRef.current[i + 1],
          end: "top 20%",
          pin: true,
          pinSpacing: false,
          animation: gsap.to(card, {
            scale: 0.9,
            opacity: 0.5,
            filter: "blur(10px)",
            ease: "none"
          }),
          scrub: true,
        });
      });
    }
  }, { scope: sectionRef });

  const steps = [
    {
      step: '01',
      title: 'Define Valid Passport',
      desc: 'Upload logos, fonts, constraints, and historical performers. The swarm builds a mathematical model of your aesthetic.',
      icon: <Settings className="w-8 h-8 text-accent"/>
    },
    {
      step: '02',
      title: 'Review Terminal',
      desc: '60 variations land in your dashboard daily. Swipe right to approve distribution. Swipe left to trigger iterative loops.',
      icon: <GitBranch className="w-8 h-8 text-accent"/>
    },
    {
      step: '03',
      title: 'Algorithm Deploy',
      desc: 'Approved media binds automatically to Meta Ads, TikTok, and YouTube via verified API tokens.',
      icon: <Share2 className="w-8 h-8 text-accent"/>
    }
  ];

  return (
    <section ref={sectionRef} className="relative z-10 py-32 bg-white max-w-5xl mx-auto px-6 hidden md:block">
      <div className="mb-24 text-center">
        <h2 className="text-[40px] md:text-[56px] font-[700] tracking-tighter text-text-dark font-sans">
          The Deployment Protocol.
        </h2>
      </div>
      
      <div className="relative">
        {steps.map((item, i) => (
          <div 
            key={i}
            ref={el => { cardsRef.current[i] = el; }}
            className={`w-full bg-surface border border-surface-edge rounded-[3rem] p-16 md:p-20 shadow-xl mb-[5vh] origin-top flex flex-col md:flex-row items-center gap-16`}
            style={{ zIndex: steps.length - i }}
          >
            <div className="w-32 h-32 rounded-full border border-surface-edge bg-white flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-workspace opacity-50" />
               <div className="relative z-10 bg-surface rounded-full p-6 shadow-sm border border-surface-edge">
                  {item.icon}
               </div>
            </div>
            
            <div className="flex-1">
              <div className="font-mono text-[18px] text-accent font-[700] mb-4">SYSTEM.PHASE_{item.step}</div>
              <h3 className="font-[700] text-[32px] text-text-dark tracking-tight mb-4">{item.title}</h3>
              <p className="text-[18px] text-slate leading-[1.6]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Leaf, Droplets, Sprout, Check, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useRef } from 'react';
import heroBanner from '@/assets/hero-gut-health-banner.jpg';
import heroVideo from '@/assets/hero-gut-health.mp4';
const benefits = [
  { text: 'Live probiotic cultures' },
  { text: 'Organic & bio-based inputs' },
  { text: 'Shipped across South Africa & Africa' },
  { text: 'Trusted by clinics, farmers & families' },
];

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 0.85]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Video Background - African Nature + Fermentation scenes */}
      <motion.div 
        className="absolute inset-0"
        style={{ scale, opacity: videoOpacity }}
      >
        {/* Hero Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroBanner}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
          {/* Fallback to banner image */}
          <img
            src={heroBanner}
            alt="Gut Health Probiotics - Kefir, Spirulina, and Wheatgrass with African farmland"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </video>
      </motion.div>
      
      {/* Multi-Layer Cinematic Gradient Overlays */}
      <motion.div 
        className="absolute inset-0 z-[1]"
        style={{ opacity: overlayOpacity }}
      >
        {/* Deep forest gradient from edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_0%,rgba(11,61,46,0.4)_50%,rgba(11,61,46,0.95)_100%)]" />
        {/* Top-down vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B3D2E]/70 via-transparent to-[#0B3D2E]/90" />
        {/* Side gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B3D2E]/50 via-transparent to-[#0B3D2E]/50" />
        {/* Bottom fade to content */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </motion.div>

      {/* Animated Floating Microbe/Bubble Elements */}
      <div className="absolute inset-0 overflow-hidden z-[2] pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
              left: `${Math.random() * 100}%`,
              bottom: '-30px',
              background: `radial-gradient(circle, rgba(34,197,94,${0.3 + Math.random() * 0.3}) 0%, transparent 70%)`,
              filter: 'blur(1px)',
            }}
            animate={{
              y: [0, -(window.innerHeight + 100)],
              x: [0, (Math.random() - 0.5) * 100],
              opacity: [0, 0.8, 0.8, 0],
              scale: [0.5, 1, 1.2, 0.8],
            }}
            transition={{
              duration: Math.random() * 12 + 8,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Organic Glow Orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Content with Parallax */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 text-center text-white pt-20"
        style={{ y: textY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-6xl mx-auto"
        >
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 mb-6 px-6 py-2.5 rounded-full border border-[#22C55E]/30 bg-[#0B3D2E]/60 backdrop-blur-md"
          >
            <Leaf className="w-4 h-4 text-[#22C55E]" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFF7EC]">
              Natural Wellness from Earth to Home
            </span>
          </motion.div>
          
          {/* Main Title - Layered Typography */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mb-6"
          >
            <motion.span 
              className="block font-serif text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
            >
              <span className="text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.3)]">Gut Health</span>
            </motion.span>
            <motion.span 
              className="block font-serif text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mt-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9 }}
            >
              <span 
                className="bg-gradient-to-r from-[#22C55E] via-[#4ADE80] to-[#3B82F6] bg-clip-text text-transparent"
                style={{ 
                  filter: 'drop-shadow(0 4px 40px rgba(34,197,94,0.4))',
                }}
              >
                Probiotics South Africa
              </span>
            </motion.span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-lg md:text-xl lg:text-2xl text-[#FFF7EC]/80 mb-8 max-w-4xl mx-auto font-light leading-relaxed"
          >
            Live cultures, organic growing & bio-fertilizers for{' '}
            <span className="text-[#22C55E] font-medium">homes, clinics and farms</span>{' '}
            across Africa.
          </motion.p>

          {/* Pill Badges - Slide in from left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium"
              >
                <Check className="w-4 h-4 text-[#22C55E]" />
                {benefit.text}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons - Premium styling */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/products">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-[#22C55E] hover:bg-[#16A34A] text-white text-lg px-10 py-7 rounded-full shadow-[0_20px_50px_-15px_rgba(34,197,94,0.5)] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_60px_-15px_rgba(34,197,94,0.6)]"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Droplets className="h-5 w-5" />
                  Shop Gut Health
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                />
              </Button>
            </Link>
            
            <Link to="/products?category=bio-fertilizers">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white text-lg px-8 py-7 rounded-full shadow-[0_20px_50px_-15px_rgba(217,119,6,0.4)] transition-all duration-500 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Sprout className="h-5 w-5" />
                  Shop Farming & EM1
                </span>
              </Button>
            </Link>

            <WhatsAppButton 
              message="Hi! I'm interested in your gut health probiotics and fermentation products. Can you help me get started?"
              className="text-lg px-8 py-7 rounded-full shadow-[0_20px_50px_-15px_rgba(37,211,102,0.4)] hover:scale-105 transition-all duration-500 border-2 border-[#25D366] bg-transparent hover:bg-[#25D366]"
            >
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                WhatsApp Us
              </span>
            </WhatsAppButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Cinematic Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-[5]" />

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-white/50 font-medium">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-2.5 bg-[#22C55E] rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Anchor Link for Featured Products */}
      <a href="#featured-products" className="hidden" aria-label="Jump to featured products" />
    </section>
  );
}

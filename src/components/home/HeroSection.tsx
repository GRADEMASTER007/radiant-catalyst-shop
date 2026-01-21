import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.6, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic Background with Parallax */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1920)',
          y: backgroundY,
          scale,
        }}
      />
      
      {/* Multi-Layer Cinematic Gradient Overlays */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity: overlayOpacity }}
      >
        {/* Deep vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(25_55%_10%/0.4)_50%,hsl(25_55%_5%/0.9)_100%)]" />
        
        {/* Cinematic color grade - warm amber tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-transparent to-stone-950/80" />
        
        {/* Dramatic side lighting */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/60 via-transparent to-amber-950/60" />
        
        {/* Bottom film fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
      </motion.div>

      {/* Animated Film Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Tribal Pattern Overlay */}
      <motion.div 
        className="absolute inset-0 opacity-5"
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{ 
          duration: 60, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='%23fff' fill-opacity='0.15'/%3E%3Cpath d='M40 20L60 40L40 60L20 40z' fill='none' stroke='%23fff' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Lens Flare Effect */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(45 95% 70% / 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content with Parallax */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 text-center text-white"
        style={{ y: textY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-5xl mx-auto"
        >
          {/* Cinematic Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-950/30 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium tracking-widest uppercase text-amber-200">
              Authentic African Craftsmanship
            </span>
          </motion.div>
          
          {/* Epic Title with Cinematic Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 leading-[0.9] tracking-tight"
          >
            <span className="block text-white/90 drop-shadow-2xl">Discover the</span>
            <motion.span 
              className="block relative"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <span className="relative z-10" style={{ 
                background: 'linear-gradient(135deg, hsl(45 95% 65%), hsl(25 90% 55%), hsl(15 85% 50%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 30px hsl(45 95% 50% / 0.3))',
              }}>
                Soul of Africa
              </span>
              {/* Glow effect behind text */}
              <span className="absolute inset-0 blur-2xl opacity-50" style={{
                background: 'linear-gradient(135deg, hsl(45 95% 65%), hsl(25 90% 55%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Soul of Africa
              </span>
            </motion.span>
          </motion.h1>

          {/* Cinematic Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-lg md:text-xl lg:text-2xl text-white/70 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Handcrafted treasures from skilled artisans across the continent. 
            <span className="text-amber-300/90"> Each piece tells a story</span> of heritage, tradition, and artistry.
          </motion.p>

          {/* Epic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/products">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-white text-lg px-10 py-7 rounded-full shadow-2xl shadow-orange-500/30 transition-all duration-500 hover:scale-105 hover:shadow-orange-500/50"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  Begin Your Journey
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </Link>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="group text-lg px-8 py-7 rounded-full border-2 border-white/20 text-white/90 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
            >
              <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Our Story
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Cinematic Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Animated Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-amber-400/80 rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Side Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 1 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-16 bg-gradient-to-b from-amber-400/50 to-transparent rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 1 }}
        className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-16 bg-gradient-to-b from-transparent to-amber-400/50 rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.2 + 0.5, repeat: Infinity }}
          />
        ))}
      </motion.div>
    </section>
  );
}

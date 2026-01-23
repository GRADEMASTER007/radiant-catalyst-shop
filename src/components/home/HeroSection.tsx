import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Leaf, Droplets, Sprout, FlaskConical, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useRef } from 'react';

const benefits = [
  { icon: Check, text: 'Live probiotic cultures' },
  { icon: Check, text: 'Organic & bio-based inputs' },
  { icon: Check, text: 'Shipped across South Africa & neighbouring countries' },
  { icon: Check, text: 'Friendly support for clinics, farms & home users' },
];

const scrollingText = "🧬 GUT HEALTH PROBIOTICS • KEFIR • KOMBUCHA • EM1 • SPIRULINA • FERMENTATION • ORGANIC LIVING • ";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.6, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background Placeholder */}
      <motion.div 
        className="absolute inset-0"
        style={{ scale }}
      >
        {/* Placeholder: Upload video of live cultures, bubbling kefir, kombucha, wheatgrass, family kitchen */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gut-forest via-gut-green to-gut-teal">
          {/* Animated bubbles for fermentation effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: Math.random() * 20 + 10,
                  height: Math.random() * 20 + 10,
                  left: `${Math.random() * 100}%`,
                  bottom: '-20px',
                }}
                animate={{
                  y: [0, -window.innerHeight - 100],
                  opacity: [0, 0.6, 0.6, 0],
                }}
                transition={{
                  duration: Math.random() * 8 + 6,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Multi-Layer Organic Gradient Overlays */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity: overlayOpacity }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(142_55%_15%/0.4)_50%,hsl(30_30%_10%/0.9)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-gut-forest/50 via-transparent to-gut-dark/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-gut-forest/40 via-transparent to-gut-teal/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </motion.div>

      {/* Scrolling Text Banner - Top */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gut-green via-gut-forest to-gut-green py-2 overflow-hidden z-20">
        <div className="flex whitespace-nowrap scroll-text">
          <span className="text-white font-bold text-sm tracking-wider mx-4">
            {scrollingText.repeat(6)}
          </span>
        </div>
      </div>

      {/* Organic Glow Effects */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(142 55% 50% / 0.15) 0%, transparent 70%)',
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

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(185 50% 45% / 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Content with Parallax */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 text-center text-white pt-16"
        style={{ y: textY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full border border-gut-lime/40 bg-gut-forest/40 backdrop-blur-sm"
          >
            <Leaf className="w-4 h-4 text-gut-lime" />
            <span className="text-sm font-medium tracking-widest uppercase text-gut-cream">
              Natural Wellness from Earth to Home
            </span>
          </motion.div>
          
          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 leading-[0.95] tracking-tight"
          >
            <motion.span 
              className="block relative"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <span className="relative z-10 text-white drop-shadow-2xl">Gut Health</span>
            </motion.span>
            <motion.span 
              className="block relative mt-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <span className="relative z-10" style={{ 
                background: 'linear-gradient(135deg, hsl(142 55% 55%), hsl(95 60% 55%), hsl(185 50% 50%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 30px hsl(142 55% 50% / 0.3))',
              }}>
                Probiotics South Africa
              </span>
            </motion.span>
          </motion.h1>

          {/* Brand Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
          >
            <FlaskConical className="w-6 h-6 text-gut-lime" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white/90">Live cultures, organic growing & biofertilizers</p>
              <p className="text-xs text-gut-lime/80">For homes, clinics & farms</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-base md:text-lg lg:text-xl text-white/75 mb-8 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Discover the power of fermentation with our premium kefir, kombucha, yogurt cultures, 
            <span className="text-gut-lime/90"> live spirulina & chlorella</span>, 
            and EM1 bio-fertilizers. Trusted by health practitioners and farmers across Africa.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to="/products">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-gut-green via-gut-lime to-gut-teal hover:from-gut-lime hover:via-gut-green hover:to-gut-forest text-white text-lg px-10 py-7 rounded-full shadow-2xl shadow-gut-green/30 transition-all duration-500 hover:scale-105 hover:shadow-gut-green/50"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Droplets className="h-5 w-5" />
                  Shop Gut Health
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </Link>
            
            <Link to="/products?category=farming-em1">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-gut-brown via-gut-gold to-gut-brown hover:from-gut-gold hover:via-gut-brown hover:to-gut-gold text-white text-lg px-8 py-7 rounded-full shadow-2xl shadow-gut-brown/30 transition-all duration-500 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2 font-semibold">
                  <Sprout className="h-5 w-5" />
                  Shop Farming & EM1
                </span>
              </Button>
            </Link>

            <WhatsAppButton 
              message="Hi! I'm interested in your gut health probiotics and fermentation products. Can you please provide more information?"
              className="text-lg px-8 py-7 rounded-full shadow-2xl shadow-[#25D366]/30 hover:scale-105 transition-all duration-500"
            >
              WhatsApp Us
            </WhatsAppButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Benefits Strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-32 left-0 right-0 z-20"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm"
              >
                <benefit.icon className="w-4 h-4 text-gut-lime" />
                {benefit.text}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Cinematic Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-gut-lime/80 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

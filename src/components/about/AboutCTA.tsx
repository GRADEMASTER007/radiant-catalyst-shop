import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Phone } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export const AboutCTA = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-8 md:p-12 rounded-3xl text-center max-w-3xl mx-auto bg-gradient-to-br from-[#0B3D2E]/10 to-[#22C55E]/10"
        >
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold mb-4">
            Start Your Gut Health Journey Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you're looking for live kefir grains, kombucha cultures, spirulina, 
            or EM1 bio-fertilizers — we're here to help you live naturally and thrive.
          </p>
          
          {/* Contact Info */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="tel:+27834474639"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Phone className="h-4 w-4" />
              +27 83 447 4639
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button className="btn-sunset px-8">Shop All Products</Button>
            </Link>
            <WhatsAppButton 
              message="Hi! I'm interested in your gut health products and live probiotic cultures."
              variant="default"
              className="px-8"
            >
              Contact via WhatsApp
            </WhatsAppButton>
            <Link to="/contact">
              <Button variant="outline" className="px-8">Get in Touch</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

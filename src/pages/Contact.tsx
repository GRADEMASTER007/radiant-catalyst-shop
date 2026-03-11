import { motion } from "motion/react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Send,
  Headphones,
  Globe
} from "lucide-react";

const contactMethods = [
  {
    icon: Headphones,
    title: "Reception & Professional Assistant",
    description: "Our friendly reception and professionally trained assistant is ready to help with product information, pricing, and general enquiries.",
    contact: "+1 351 777 2848",
    action: "tel:+13517772848",
    actionLabel: "Call Now",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Clock,
    title: "After-Hours Support",
    description: "Need help outside business hours? We're still here for you.",
    contact: "083 447 4639",
    secondaryContact: "WhatsApp: +27 83 447 4639",
    action: "tel:0834474639",
    actionLabel: "Call After-Hours",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us an email and we'll respond within 24 hours.",
    contact: "admin@proagrisa.co.za",
    action: "mailto:admin@proagrisa.co.za",
    actionLabel: "Send Email",
    gradient: "from-amber-500 to-orange-500",
  },
];

const whatsappNumbers = [
  { label: "WhatsApp 1", number: "+15557083482", display: "+1 555 708 3482" },
  { label: "WhatsApp 2", number: "+15557083482", display: "+1 555 708 3482" },
];

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission would go here
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    
    // Open WhatsApp with the message
    const whatsappMessage = `Hi DFSA! My name is ${name}. ${message}\n\nEmail: ${email}`;
    window.open(`https://wa.me/27834474639?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dragon-green/20 via-transparent to-dragon-pink/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageCircle className="h-4 w-4" />
              Get in Touch
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Contact{" "}
              <span className="text-gradient-tropical">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We're always happy to help! Feel free to reach out to us using any of the options below, 
              and we'll make sure you get the support you need.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-6 relative">
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${method.gradient}`} />
                    
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <method.icon className="h-7 w-7 text-white" />
                    </div>
                    
                    <h3 className="font-display text-xl font-bold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                    
                    <div className="space-y-1 mb-4">
                      <p className="font-semibold text-foreground">{method.contact}</p>
                      {method.secondaryContact && (
                        <p className="text-sm text-muted-foreground">{method.secondaryContact}</p>
                      )}
                    </div>
                    
                    <Button asChild className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90`}>
                      <a href={method.action}>
                        {method.actionLabel}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* WhatsApp Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* WhatsApp Info */}
                  <div className="p-8 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-bold">WhatsApp Support</h3>
                        <p className="text-muted-foreground">Fastest way to reach us</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6">
                      Connect with our team instantly via WhatsApp. Get quick responses about products, 
                      pricing, bulk orders, and farming consultations.
                    </p>
                    
                    <div className="space-y-4">
                      {whatsappNumbers.map((wa, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
                          <div>
                            <p className="font-medium">{wa.label}</p>
                            <p className="text-sm text-muted-foreground">{wa.display}</p>
                          </div>
                          <WhatsAppButton 
                            message="Hi DFSA! I'm interested in your dragon fruit plants."
                            className="px-4"
                          >
                            Chat
                          </WhatsAppButton>
                        </div>
                      ))}
                      
                      {/* After-hours WhatsApp */}
                      <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border-2 border-[#25D366]/30">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#25D366]" />
                            After-Hours WhatsApp
                          </p>
                          <p className="text-sm text-muted-foreground">+27 83 447 4639</p>
                        </div>
                        <WhatsAppButton 
                          message="Hi DFSA! I need after-hours assistance."
                          className="px-4"
                        >
                          Chat
                        </WhatsAppButton>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="p-8 bg-card">
                    <h3 className="font-display text-2xl font-bold mb-2">Send us a Message</h3>
                    <p className="text-muted-foreground mb-6">
                      Fill out the form and we'll get back to you shortly.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input 
                            id="name" 
                            name="name" 
                            placeholder="John Doe" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="john@example.com" 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          placeholder="+27 83 000 0000" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject" 
                          name="subject" 
                          placeholder="Product inquiry, bulk order, consultation..." 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea 
                          id="message" 
                          name="message" 
                          placeholder="Tell us how we can help you..." 
                          rows={4}
                          required 
                        />
                      </div>
                      
                      <Button type="submit" className="w-full btn-sunset gap-2">
                        <Send className="h-4 w-4" />
                        Send via WhatsApp
                      </Button>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Your message will open in WhatsApp for instant delivery
                      </p>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold">We Ship Worldwide</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Dragon Fruit Farming Africa exports premium dragon fruit plants to farmers across Africa and worldwide.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {['South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Uganda', 'Namibia', 'Malawi', 'Worldwide'].map((country) => (
                <span
                  key={country}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border text-sm font-medium"
                >
                  <MapPin className="h-3 w-3 text-primary" />
                  {country}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8 md:p-12 rounded-3xl max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Your Dragon Fruit Journey?
            </h2>
            <p className="text-muted-foreground mb-8">
              Whether you're a hobbyist or a commercial farmer, we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WhatsAppButton className="text-lg px-8 py-6 rounded-full">
                Chat on WhatsApp
              </WhatsAppButton>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <a href="tel:+13517772848">
                  <Phone className="h-5 w-5 mr-2" />
                  Call Reception
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

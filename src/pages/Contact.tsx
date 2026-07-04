import { motion } from "motion/react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  Globe,
} from "lucide-react";

const WHATSAPP_NUMBER = "+27834474639";
const WHATSAPP_DISPLAY = "+27 83 447 4639";
const EMAIL = "admin@proagrisa.co.za";
const OFFICE = "Krugersdorp, West Rand, Gauteng, South Africa";
const HOURS = "Monday – Saturday, 08:00 – 17:00 (SAST)";

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description:
      "Fastest way to reach us for orders, product questions and support.",
    contact: WHATSAPP_DISPLAY,
    action: `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}`,
    actionLabel: "Chat on WhatsApp",
    gradient: "from-[#25D366] to-[#128C7E]",
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us an email and we'll respond within 24 hours.",
    contact: EMAIL,
    action: `mailto:${EMAIL}`,
    actionLabel: "Send Email",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Our office and dispatch base in Gauteng, South Africa.",
    contact: OFFICE,
    secondaryContact: HOURS,
    action: "https://maps.google.com/?q=Krugersdorp,+Gauteng,+South+Africa",
    actionLabel: "View on Map",
    gradient: "from-emerald-500 to-teal-500",
    external: true,
  },
];

const websites = [
  {
    name: "Purely Health Nutra",
    url: "https://purelyhealthnutra.com",
    description: "Live probiotic cultures, fermentation starters & superfoods.",
  },
  {
    name: "Wonderful Dragon Fruit",
    url: "https://wonderfuldragonfruit.com",
    description: "Premium dragon fruit cuttings, plants & growing supplies.",
  },
];

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const email = formData.get("email");
    const subject = formData.get("subject");
    const message = formData.get("message");

    const whatsappMessage =
      `Hi Purely Health Nutra! My name is ${name}.\n\n` +
      `Subject: ${subject}\n${message}\n\nEmail: ${email}`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank",
    );
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Purely Health Nutra",
      url: "https://purelyhealthnutra.com/contact",
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Purely Health Nutra",
      email: EMAIL,
      telephone: WHATSAPP_NUMBER,
      url: "https://purelyhealthnutra.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Krugersdorp",
        addressRegion: "Gauteng",
        addressCountry: "ZA",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:00",
          closes: "17:00",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Purely Health Nutra | Krugersdorp, Gauteng"
        description="Contact Purely Health Nutra in Krugersdorp, Gauteng. WhatsApp +27 83 447 4639, email admin@proagrisa.co.za. Mon–Sat 08:00–17:00. Nationwide delivery across South Africa."
        canonical="https://purelyhealthnutra.com/contact"
        jsonLd={jsonLd}
      />
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
              Contact <span className="text-gradient-tropical">Purely Health Nutra</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Based in Krugersdorp, West Rand, Gauteng — shipping premium live
              cultures, dragon fruit and natural health products across South
              Africa. Reach us on WhatsApp, email, or fill in the form below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick facts strip */}
      <section className="pb-4">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-2xl p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Office</p>
                <p className="text-muted-foreground">Krugersdorp, West Rand, Gauteng</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="text-muted-foreground">Mon – Sat, 08:00 – 17:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">WhatsApp</p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}`} className="text-muted-foreground hover:text-primary">
                  {WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Email</p>
                <a href={`mailto:${EMAIL}`} className="text-muted-foreground hover:text-primary break-all">
                  {EMAIL}
                </a>
              </div>
            </div>
          </div>
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
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${method.gradient}`} />

                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <method.icon className="h-7 w-7 text-white" />
                    </div>

                    <h2 className="font-display text-xl font-bold mb-2">{method.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{method.description}</p>

                    <div className="space-y-1 mb-4">
                      <p className="font-semibold text-foreground">{method.contact}</p>
                      {method.secondaryContact && (
                        <p className="text-sm text-muted-foreground">{method.secondaryContact}</p>
                      )}
                    </div>

                    <Button asChild className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90 text-white`}>
                      <a
                        href={method.action}
                        target={method.external ? "_blank" : undefined}
                        rel={method.external ? "noopener noreferrer" : undefined}
                      >
                        {method.actionLabel}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* WhatsApp + Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-2xl font-bold">WhatsApp Support</h2>
                        <p className="text-muted-foreground">Mon – Sat, 08:00 – 17:00</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6">
                      Chat with our team on WhatsApp for quick answers about
                      products, pricing, courier delivery, bulk orders and
                      farming consultations.
                    </p>

                    <div className="p-4 bg-background/60 rounded-xl mb-4">
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-semibold text-lg">{WHATSAPP_DISPLAY}</p>
                    </div>

                    <WhatsAppButton
                      message="Hi Purely Health Nutra! I'd like more information about your products."
                      className="w-full"
                    >
                      Start WhatsApp Chat
                    </WhatsAppButton>

                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="font-display text-lg font-bold">Our Websites</h3>
                      </div>
                      <div className="space-y-3">
                        {websites.map((site) => (
                          <a
                            key={site.url}
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg bg-background/60 hover:bg-background transition-colors"
                          >
                            <p className="font-semibold text-primary">{site.name}</p>
                            <p className="text-xs text-muted-foreground">{site.url.replace("https://", "")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{site.description}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="p-8 bg-card">
                    <h2 className="font-display text-2xl font-bold mb-2">Send us a Message</h2>
                    <p className="text-muted-foreground mb-6">
                      Fill out the form and it will open in WhatsApp for instant delivery.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+27 83 000 0000" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" name="subject" placeholder="Product inquiry, bulk order, consultation..." required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea id="message" name="message" placeholder="Tell us how we can help you..." rows={4} required />
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

      {/* Shipping regions */}
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
              <h2 className="font-display text-2xl font-bold">Nationwide & Regional Delivery</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Courier delivery across South Africa, with regional shipping to
              neighbouring SADC countries on request.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {['South Africa', 'Botswana', 'Namibia', 'Zimbabwe', 'Zambia', 'Mozambique', 'Lesotho', 'Eswatini'].map((country) => (
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
    </div>
  );
};

export default Contact;

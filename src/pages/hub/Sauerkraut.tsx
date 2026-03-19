import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';
import { Link } from 'react-router-dom';

const faqs = [
  { question: 'What is sauerkraut?', answer: 'Sauerkraut is finely shredded cabbage that has been fermented by lactic acid bacteria (primarily Lactobacillus). The fermentation process preserves the cabbage while creating beneficial probiotics, vitamins, and enzymes. It\'s one of the oldest and simplest fermented foods.' },
  { question: 'Do I need a starter culture for sauerkraut?', answer: 'No! Sauerkraut is one of the few fermented foods that doesn\'t require a starter culture. The naturally occurring Lactobacillus bacteria on the cabbage leaves do all the work — you just need cabbage, salt, and patience. However, we offer related cultures like water kefir and kombucha for other fermented beverages.' },
  { question: 'How do I make sauerkraut at home?', answer: 'Shred one head of cabbage, massage with 1–2 tablespoons of salt until juicy, pack tightly into a jar (submerging the cabbage under its own brine), cover with a cloth, and ferment at room temperature for 1–4 weeks. Taste periodically until you like the flavour, then refrigerate.' },
  { question: 'How long does sauerkraut fermentation take?', answer: 'Minimum 5–7 days for a mild sauerkraut, 2–4 weeks for a more tangy, complex flavour. In South Africa\'s warmer climates, fermentation tends to be faster. Taste it regularly and refrigerate when it reaches your preferred level of sourness.' },
  { question: 'What are the health benefits of sauerkraut?', answer: 'Sauerkraut is rich in probiotics (Lactobacillus species), vitamin C, vitamin K2, and fibre. Fermentation may increase the bioavailability of nutrients and support a healthy gut microbiome. Disclaimer: These statements have not been evaluated by SAHPRA. This product is not intended to diagnose, treat, cure, or prevent any disease.' },
  { question: 'Can I ferment other vegetables?', answer: 'Absolutely! The same lacto-fermentation technique works for carrots, radishes, green beans, peppers, garlic, and more. You can also make kimchi (Korean-style fermented vegetables), curtido, and pickles using similar methods.' },
  { question: 'What equipment do I need?', answer: 'At its simplest: a knife, cutting board, mixing bowl, salt, and a glass jar. For better results, consider a fermentation crock, weights to keep vegetables submerged, and an airlock lid. But beginners can absolutely start with just a mason jar.' },
  { question: 'Where can I buy fermentation supplies in South Africa?', answer: 'Purely Health Nutra supplies everything you need for home fermentation — from live cultures (kefir, kombucha, sourdough, vinegar) to natural brown sugar for water kefir. We ship from Gauteng to all provinces and export internationally.' },
];

export default function Sauerkraut() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Sauerkraut', url: 'https://purelyhealthnutra.com/sauerkraut' }]), faqJsonLd(faqs)];
  return (
    <PageShell>
      <SEOHead title="Sauerkraut South Africa | Fermentation Guide | Purely Health Nutra" description="Learn to make sauerkraut at home in South Africa. Fermentation tips, gut health benefits & related probiotic cultures. Based in Gauteng, shipping nationwide." canonical="https://purelyhealthnutra.com/sauerkraut" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Sauerkraut' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Sauerkraut Starter Tips & Fermentation Basics (South Africa)</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Discover the art of making <strong>sauerkraut</strong> and other lacto-fermented vegetables at home. This ancient preservation technique produces probiotic-rich foods that support gut health — and it's incredibly simple. No special equipment or starter culture needed, just cabbage, salt, and time.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is Sauerkraut?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Sauerkraut (German for "sour cabbage") is one of the world's oldest fermented foods. Finely shredded cabbage is salted and packed into an airtight container, where naturally occurring Lactobacillus bacteria convert the cabbage's sugars into lactic acid. This creates a tangy, crunchy, probiotic-rich condiment that can be stored for months.</p>
          <p className="text-muted-foreground leading-relaxed">In South Africa, home fermentation is growing rapidly as people discover the flavour and health benefits of traditional fermented foods. Sauerkraut is the perfect gateway — it requires no special cultures and uses ingredients available at any supermarket.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits of Fermented Foods</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Probiotic-Rich', desc: 'Lacto-fermented vegetables contain billions of beneficial Lactobacillus bacteria per serving.' },
              { title: 'Vitamin C Boost', desc: 'Fermentation preserves and may even increase vitamin C content — historically used to prevent scurvy.' },
              { title: 'Improved Digestion', desc: 'The probiotics and enzymes in fermented foods may support healthy digestion and nutrient absorption.' },
              { title: 'Food Preservation', desc: 'Fermentation is a natural, zero-energy preservation method that keeps vegetables for months.' },
            ].map(b => (
              <div key={b.title} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">Disclaimer: These statements have not been evaluated by SAHPRA. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Make Sauerkraut at Home</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li>Remove outer leaves from a head of cabbage. Shred finely with a knife or mandoline</li>
            <li>Weigh the cabbage and measure 2% salt by weight (e.g., 20g salt per 1kg cabbage)</li>
            <li>Massage the salt into the cabbage for 5–10 minutes until it releases plenty of liquid</li>
            <li>Pack tightly into a clean glass jar, pressing down so the brine covers the cabbage</li>
            <li>Weight the cabbage down (a small jar filled with water works well) to keep it submerged</li>
            <li>Cover with a cloth or loose lid and leave at room temperature (18–24°C)</li>
            <li>Taste daily from day 5 onwards. Refrigerate when it reaches your preferred tanginess (usually 1–4 weeks)</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Expand Your Fermentation Journey</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Once you've mastered sauerkraut, explore our range of live cultures for more fermented foods and beverages:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { path: '/kefir-grains', label: 'Water & Milk Kefir Grains' },
              { path: '/kombucha', label: 'Kombucha SCOBY Cultures' },
              { path: '/sourdough-starter', label: 'Sourdough Starters' },
              { path: '/vinegar-starter-culture', label: 'Vinegar Mother Cultures' },
              { path: '/natural-sugar', label: 'Natural Brown Sugar (for fermentation)' },
              { path: '/natural-probiotics', label: 'All Natural Probiotics' },
            ].map(l => (
              <Link key={l.path} to={l.path} className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors font-medium text-foreground hover:text-primary">
                → {l.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Home cooks, health enthusiasts, chefs, and wellness practitioners across all nine South African provinces. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/sauerkraut" />
      </article>
    </PageShell>
  );
}

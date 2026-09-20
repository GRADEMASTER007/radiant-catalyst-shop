import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';
import { Link } from 'react-router-dom';
import {
  Microscope,
  GraduationCap,
  FlaskConical,
  Factory,
  Home,
  Leaf,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  Sprout,
  ArrowRight,
} from 'lucide-react';

const audiences = [
  { icon: Home, title: 'Home Growers', desc: 'Compact tabletop or balcony setups for fresh, daily superfood harvests.' },
  { icon: GraduationCap, title: 'Schools & Colleges', desc: 'Living teaching cultures for biology, ecology, and sustainability classes.' },
  { icon: FlaskConical, title: 'Universities & Laboratories', desc: 'Pure starter strains for microbiology, biotech, and food science research.' },
  { icon: Microscope, title: 'Research Institutions', desc: 'Reliable Arthrospira platensis cultures for nutrition, bioremediation & pharma studies.' },
  { icon: Factory, title: 'Industrial & Commercial Farms', desc: 'Scalable inoculum for raceway ponds, photobioreactors, and powder production.' },
  { icon: Leaf, title: 'Health Practitioners', desc: 'Whole-food protein and micronutrient source to recommend or resell.' },
];

const phases = [
  {
    icon: Sprout,
    title: 'Phase 1 — Inoculation (Days 0–3)',
    desc: 'Introduce the live Spirulina culture into pre-mixed growing medium at 25–32 °C, pH 9–10. Maintain gentle agitation and indirect light to let cells acclimatise without shock.',
  },
  {
    icon: Sun,
    title: 'Phase 2 — Lag & Light Adaptation (Days 3–7)',
    desc: 'Cells re-orient their photosynthetic machinery. Increase light gradually to 2,000–5,000 lux. Avoid harsh midday sun on small ponds to prevent photo-bleaching.',
  },
  {
    icon: Wind,
    title: 'Phase 3 — Exponential Growth (Days 7–14)',
    desc: 'Biomass roughly doubles every 2–3 days. Continuous slow stirring (8–24 hours/day), CO₂ availability, and our proprietary feed fertilizer drive vigorous filament formation.',
  },
  {
    icon: Droplets,
    title: 'Phase 4 — Harvest Density (Day 14+)',
    desc: 'Harvest when optical density reaches a deep emerald green (≈0.5–0.8 g/L dry weight). Filter through 30–50 µm cloth, rinse with fresh water, and either consume fresh or dehydrate below 45 °C to preserve phycocyanin.',
  },
  {
    icon: Thermometer,
    title: 'Phase 5 — Maintenance & Re-feeding',
    desc: 'After each harvest, top up the pond with fresh medium, re-dose feed fertilizer, and monitor pH, salinity, and temperature daily. A well-managed pond produces continuously for years.',
  },
];

const faqs = [
  { question: 'What is Spirulina (Arthrospira platensis)?', answer: 'Spirulina is an oxygenic photosynthetic cyanobacterium found worldwide in fresh and alkaline marine waters. It has been used for centuries as a staple food and is one of the densest known sources of complete plant protein, B-vitamins, iron, and the blue pigment phycocyanin — without significant side effects when consumed as food.' },
  { question: 'Why buy a live Spirulina culture instead of dried powder?', answer: 'A live culture lets you grow your own continuous, fresh supply for a fraction of the long-term cost. Fresh Spirulina also retains heat-sensitive nutrients (phycocyanin, enzymes, and certain B-vitamins) that degrade in commercial drying processes.' },
  { question: 'How long has your team been cultivating Spirulina?', answer: 'We have been cultivating Spirulina for over 20 years across pilot ponds, indoor tanks, and commercial-scale raceways here in South Africa. During that time we have refined our own feed fertilizer specifically formulated for Spirulina growth in local water and climate conditions.' },
  { question: 'What growing conditions does Spirulina need?', answer: 'Spirulina thrives in alkaline water (pH 9–10.5), warm temperatures (25–35 °C), bright indirect light, and gentle continuous agitation. It is naturally resistant to contamination because few other organisms tolerate its high-pH environment.' },
  { question: 'Do you supply schools, universities, and laboratories?', answer: 'Yes. We supply axenic and semi-axenic Arthrospira platensis starter cultures to schools, colleges, universities, research labs, and industrial buyers across South Africa, the SADC region, and internationally. Bulk and academic pricing is available on request.' },
  { question: 'Can I grow Spirulina at home?', answer: 'Absolutely. A 20–60 litre tank in a warm, bright spot is enough to harvest fresh Spirulina several times a week for a family. Our starter pack includes the live culture, growing instructions, and a starter dose of our proprietary feed fertilizer.' },
  { question: 'What is in your proprietary Spirulina feed fertilizer?', answer: 'Our blend supplies the nitrogen, carbon, phosphorus, potassium, iron, and trace minerals Spirulina needs to maintain rapid, healthy growth in non-marine water. The exact formulation is the result of two decades of in-house optimisation and is supplied with full dosing instructions.' },
  { question: 'Do you ship live Spirulina cultures across South Africa?', answer: 'Yes — we ship live cultures from Gauteng to all nine South African provinces and export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide. Cultures are packaged to remain viable in transit for up to 7 days.' },
  { question: 'Is Spirulina safe?', answer: 'Spirulina has been consumed safely as food by humans for centuries and is recognised as a protein and vitamin supplement without significant side effects. As with any dietary change, consult your healthcare provider if you are pregnant, breastfeeding, or have a medical condition. Disclaimer: Our products are not intended to diagnose, treat, cure, or prevent any disease.' },
];

export default function SpirulinaFarming() {
  const jsonLd = [
    breadcrumbJsonLd([{ name: 'Spirulina Farming', url: 'https://livingculturehealth.com/spirulina-farming' }]),
    faqJsonLd(faqs),
  ];

  return (
    <PageShell>
      <SEOHead
        title="Spirulina Farming South Africa | Live Arthrospira platensis Culture"
        description="Live Spirulina (Arthrospira platensis) culture for sale in South Africa. 20+ years of farming experience, proprietary feed fertilizer, and full growing guide for home, school, lab & industrial growers."
        canonical="https://livingculturehealth.com/spirulina-farming"
        jsonLd={jsonLd}
      />
      <Breadcrumbs items={[{ label: 'Spirulina Farming' }]} />

      <article>
        <header className="mb-10">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-3">Algae Culture Farming</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Spirulina Farming — Live Arthrospira platensis Culture
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            <strong>Spirulina (Arthrospira platensis)</strong> is an oxygenic photosynthetic bacterium found worldwide in
            fresh and marine waters. This alga represents an important staple in the human diet and has been used as a
            source of <strong>complete protein and vitamin supplementation</strong> without any significant side
            effects. We supply <strong>live Spirulina cultures</strong> for farming, industry, home growers, schools,
            universities, colleges, laboratories and research — backed by <strong>over 20 years</strong> of hands-on
            cultivation in South Africa and our own purpose-built feed fertilizer.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What is Spirulina?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Despite being commonly called a "blue-green alga", Spirulina is technically a cyanobacterium — one of the
            oldest photosynthetic life forms on Earth. Its spiral-shaped filaments contain up to <strong>60–70%
            complete protein by dry weight</strong>, all essential amino acids, B-complex vitamins (notably B1, B2 and
            B3), iron, magnesium, and the powerful blue antioxidant pigment <strong>phycocyanin</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Because Spirulina grows in highly alkaline water that few competing organisms tolerate, it is one of the
            cleanest and easiest microalgae to cultivate consistently — making it ideal for everyone from kitchen-counter
            growers to commercial producers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Who Our Live Cultures Are For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map(a => (
              <div key={a.title} className="bg-card border border-border rounded-xl p-5">
                <a.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{a.title}</h3>
                <p className="text-muted-foreground text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our 20+ Years of Spirulina Cultivation</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            For more than two decades we have cultivated Spirulina across small indoor tanks, greenhouse ponds, and
            outdoor raceway systems. Through that journey we have learned what generic textbook protocols leave out:
            how local water chemistry, seasonal sunlight, dust, and African summer heat affect culture stability — and
            how to keep ponds productive year-round.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            That experience is built into every culture we ship. You receive a vigorous, locally-adapted strain plus
            written guidance drawn from real-world South African conditions, not a translated overseas manual.
          </p>
          <div className="bg-muted/50 border-l-4 border-primary rounded-r-lg p-5">
            <h3 className="font-semibold text-foreground mb-2">Our Proprietary Spirulina Feed Fertilizer</h3>
            <p className="text-muted-foreground text-sm">
              Over those 20 years we designed and refined our own <strong>Spirulina feed fertilizer</strong> — a
              balanced blend supplying nitrogen, carbon, phosphorus, potassium, iron and trace minerals tuned for
              continuous Spirulina growth. It is supplied with every starter culture and is also available
              separately for established growers.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">The 5 Phases of Spirulina Growth</h2>
          <div className="space-y-4">
            {phases.map(p => (
              <div key={p.title} className="flex items-start gap-4 bg-card border border-border rounded-xl p-6">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Farming Practices We Recommend</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Water:</strong> Use chlorine-free water (rainwater, borehole, or de-chlorinated municipal). Maintain pH 9.5–10.5 with food-grade sodium bicarbonate.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Temperature:</strong> Optimum 30–35 °C. Below 18 °C growth stalls; above 38 °C cells stress.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Light:</strong> Bright indirect daylight or full-spectrum LEDs (12–16 hours/day). Shade outdoor ponds at midday in summer.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Agitation:</strong> Continuous gentle stirring with a paddle wheel, air-lift, or aquarium pump prevents settling and ensures even light exposure.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Feeding:</strong> Re-dose our proprietary feed fertilizer after every harvest using the included schedule.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Hygiene:</strong> Cover ponds with shade-cloth or a clear lid to keep insects and dust out without blocking light.</span></li>
            <li className="flex gap-3"><span className="text-primary font-bold">•</span><span><strong>Harvesting:</strong> Filter through fine cloth (30–50 µm), rinse with fresh water, and consume fresh within 24 hours or dehydrate below 45 °C.</span></li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Uses & Applications</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Human Nutrition', desc: 'Daily superfood, protein supplement, smoothie booster, and natural multivitamin.' },
              { title: 'Animal & Aquaculture Feed', desc: 'Premium feed for poultry, fish fry, koi, ornamental shrimp, and livestock supplementation.' },
              { title: 'Education', desc: 'Live demonstration of photosynthesis, microbial growth curves, and sustainable food production in schools and universities.' },
              { title: 'Research & Biotechnology', desc: 'Phycocyanin extraction, biofuel research, CO₂ capture studies, and pharmaceutical-grade culturing.' },
              { title: 'Industrial Production', desc: 'Scalable inoculum for raceway ponds and photobioreactors producing food-grade Spirulina powder.' },
              { title: 'Food Security Projects', desc: 'High-yield protein for community gardens, NGOs, and rural development programmes.' },
            ].map(u => (
              <div key={u.title} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-1">{u.title}</h3>
                <p className="text-muted-foreground text-sm">{u.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Disclaimer: These statements have not been evaluated by SAHPRA. Spirulina is supplied as a food product and
            is not intended to diagnose, treat, cure, or prevent any disease.
          </p>
        </section>

        <section className="mb-12 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Order a Live Spirulina Culture</h2>
          <p className="text-muted-foreground mb-6">
            Get a vigorous live <em>Arthrospira platensis</em> culture, our proprietary feed fertilizer, and a full
            written growing guide — shipped from Gauteng across South Africa and internationally. Bulk and academic
            pricing is available for schools, universities, laboratories, and industrial buyers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Enquire About Spirulina Cultures <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:border-primary transition-colors"
            >
              Browse Shop
            </Link>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/spirulina-farming" />
      </article>
    </PageShell>
  );
}

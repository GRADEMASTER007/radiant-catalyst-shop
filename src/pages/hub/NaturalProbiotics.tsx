import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const relatedCultures = [
  { path: '/kefir-grains', label: 'Kefir Grains (Water & Milk)', desc: 'One of the richest probiotic foods, containing up to 61 strains of bacteria and yeasts.' },
  { path: '/kombucha', label: 'Kombucha SCOBY', desc: 'Fermented tea loaded with organic acids, probiotics, and B vitamins.' },
  { path: '/sourdough-starter', label: 'Sourdough Starter', desc: 'Natural leavening with lactic acid bacteria that may improve bread digestibility.' },
  { path: '/sauerkraut', label: 'Sauerkraut & Fermented Veggies', desc: 'Lacto-fermented vegetables rich in Lactobacillus and other beneficial bacteria.' },
  { path: '/vinegar-starter-culture', label: 'Vinegar Mother', desc: 'Live acetic acid bacteria for making raw, unfiltered apple cider vinegar at home.' },
];

const faqs = [
  { question: 'What are natural probiotics?', answer: 'Natural probiotics are live beneficial microorganisms found in fermented foods and cultures. Unlike probiotic supplements (which are manufactured), natural probiotics come from traditional fermentation processes — kefir, kombucha, sauerkraut, yogurt, and other cultured foods.' },
  { question: 'Why choose live cultures over probiotic capsules?', answer: 'Live cultures from fermented foods provide a broader diversity of beneficial bacteria and yeasts compared to most supplements. They also come with additional nutrients (vitamins, enzymes, organic acids) created during fermentation. Plus, once you have a living culture, it provides probiotics indefinitely.' },
  { question: 'Which probiotic culture should I start with?', answer: 'For beginners, water kefir is the easiest — it requires only sugar water and produces a delicious fizzy drink in 24–48 hours. Milk kefir is also simple if you consume dairy. Kombucha takes longer (7–14 days) but is very rewarding.' },
  { question: 'Are fermented foods safe?', answer: 'Fermented foods have been consumed safely by cultures worldwide for thousands of years. The acidic environment created during fermentation naturally inhibits harmful bacteria. However, always follow proper hygiene and fermentation guidelines. Disclaimer: Our products are not intended to diagnose, treat, cure, or prevent any disease.' },
  { question: 'Do you ship probiotic cultures across South Africa?', answer: 'Yes! We ship all our live cultures from Gauteng to every province in South Africa. We also export to Botswana, Zambia, Zimbabwe, Namibia, and internationally.' },
  { question: 'Can I give fermented foods to children?', answer: 'Many families worldwide give small amounts of fermented foods to children. Start with tiny amounts and observe. Consult your paediatrician if your child has specific health conditions.' },
  { question: 'How do probiotics support gut health?', answer: 'Probiotics may help maintain a balanced gut microbiome, which research suggests plays a role in digestion, immune function, and overall wellbeing. A diverse microbiome — fed by a variety of fermented foods — is generally associated with better health outcomes.' },
  { question: 'What is the best probiotic for gut health in South Africa?', answer: 'There is no single "best" probiotic — diversity is key. Combining multiple fermented foods (kefir + kombucha + sauerkraut) provides a wider range of beneficial microorganisms than any single source. Our range of live cultures makes it easy to diversify your probiotic intake.' },
];

export default function NaturalProbiotics() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Natural Probiotics', url: 'https://livingculturehealth.com/natural-probiotics' }]), faqJsonLd(faqs)];
  return (
    <PageShell>
      <SEOHead title="Natural Probiotics South Africa | Live Cultures | Living Culture Health" description="Natural probiotics & live cultures in South Africa. Kefir, kombucha, sourdough, sauerkraut & vinegar starter cultures shipped from Gauteng nationwide." canonical="https://livingculturehealth.com/natural-probiotics" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Natural Probiotics' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Natural Probiotics & Live Cultures in South Africa</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Explore the world of <strong>natural probiotics</strong> through traditional fermented foods and live cultures. At Living Culture Health, we supply the living starter cultures you need to make your own probiotic-rich foods at home — shipped fresh from Gauteng to every corner of South Africa and beyond.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Are Natural Probiotics?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Natural probiotics are live beneficial bacteria and yeasts that occur naturally in fermented foods. For thousands of years, cultures around the world have relied on fermentation to preserve food, enhance nutrition, and support digestive health. Today, science is confirming what traditional wisdom has always known: a healthy, diverse gut microbiome is fundamental to overall wellbeing.</p>
          <p className="text-muted-foreground leading-relaxed">Rather than relying solely on manufactured probiotic capsules, you can grow your own probiotics at home using living cultures. Each fermented food provides a unique profile of beneficial microorganisms — and combining several gives you the broadest probiotic diversity.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits of Natural Probiotics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Gut Microbiome Support', desc: 'Fermented foods introduce diverse beneficial bacteria that may help maintain a balanced digestive system.' },
              { title: 'Enhanced Nutrient Absorption', desc: 'Fermentation can increase the bioavailability of vitamins and minerals in foods.' },
              { title: 'Cost-Effective & Sustainable', desc: 'Living cultures multiply — one purchase provides unlimited probiotics for life.' },
              { title: 'No Artificial Additives', desc: 'Homemade fermented foods contain no fillers, binders, or artificial ingredients found in some supplements.' },
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
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Our Live Culture Starters</h2>
          <div className="space-y-4">
            {relatedCultures.map(c => (
              <Link key={c.path} to={c.path} className="flex items-start gap-4 bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg">{c.label}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{c.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Health-conscious individuals, families, naturopaths, nutritional therapists, health food stores, restaurants, and wellness centres across all nine South African provinces. We also export to Botswana, Zambia, Zimbabwe, Namibia, and ship worldwide.</p>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/natural-probiotics" />
      </article>
    </PageShell>
  );
}

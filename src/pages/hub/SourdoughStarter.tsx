import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Rye Sourdough Starter', url: 'https://livingculturehealth.com/product/rye-sourdough-starter', description: 'Live rye sourdough starter culture. Deep, complex flavour perfect for artisan rye bread.' },
  { name: 'Wholegrain Sourdough Starter', url: 'https://livingculturehealth.com/product/wholegrain-sourdough-starter', description: 'Hearty wholegrain sourdough starter for nutritious, fibre-rich bread with a robust crust.' },
  { name: 'White Bread Sourdough Starter', url: 'https://livingculturehealth.com/product/white-bread-sourdough-starter', description: 'Classic white sourdough starter for light, airy loaves with a mild tang and crispy crust.' },
];

const faqs = [
  { question: 'What is a sourdough starter?', answer: 'A sourdough starter is a live culture of wild yeast and lactic acid bacteria maintained in a flour-and-water mixture. It acts as a natural leavening agent, replacing commercial yeast to produce bread with better flavour, texture, and digestibility.' },
  { question: 'How do I feed my sourdough starter?', answer: 'Feed your starter daily (or before each bake) by discarding half and adding equal parts flour and water by weight. For example: keep 50g of starter, add 50g flour and 50g water, mix well, and leave at room temperature for 4–8 hours until bubbly and doubled.' },
  { question: 'Can I use your starter for gluten-free bread?', answer: 'Our starters are wheat/rye-based and contain gluten. For gluten-free sourdough, you would need to create a separate culture using gluten-free flour. However, some people with mild wheat sensitivities find sourdough more digestible due to the long fermentation process that partially breaks down gluten.' },
  { question: 'How long does it take to bake sourdough bread?', answer: 'The process typically takes 12–24 hours from start to finish, including fermentation time. The actual hands-on work is only about 30 minutes — the rest is waiting for the dough to rise naturally.' },
  { question: 'Do you ship sourdough starter across South Africa?', answer: 'Yes! We ship live sourdough starters from Gauteng to all nine South African provinces. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.' },
  { question: 'How long will my sourdough starter last?', answer: 'With regular feeding, a sourdough starter can last indefinitely — some famous starters are over 100 years old! If you need to take a break, store it in the fridge and feed it once a week.' },
  { question: 'What is the difference between rye, wholegrain, and white sourdough starters?', answer: 'Each starter is cultivated with a different flour, which affects the flavour and character of your bread. Rye produces a deep, earthy loaf. Wholegrain gives a hearty, nutty bread. White creates a light, mild sourdough with an airy crumb.' },
  { question: 'Is sourdough bread healthier than regular bread?', answer: 'Many people find sourdough easier to digest than commercial yeast bread. The long fermentation process may help break down phytic acid (improving mineral absorption) and partially degrade gluten proteins. Disclaimer: Our products are not intended to diagnose, treat, cure, or prevent any disease.' },
];

const productSchemas = products.map(p => ({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, url: p.url, brand: { '@type': 'Brand', name: 'Living Culture Health' } }));

export default function SourdoughStarter() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Sourdough Starter', url: 'https://livingculturehealth.com/sourdough-starter' }]), faqJsonLd(faqs), ...productSchemas];
  return (
    <PageShell>
      <SEOHead title="Sourdough Starter South Africa | Live Cultures | Living Culture Health" description="Buy live sourdough starter cultures in South Africa. Rye, wholegrain & white bread starters shipped from Gauteng. Start baking artisan sourdough at home." canonical="https://livingculturehealth.com/sourdough-starter" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Sourdough Starter' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Sourdough Starter Cultures in South Africa</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Bake artisan sourdough bread at home with our live <strong>sourdough starter cultures</strong>, shipped fresh from Gauteng across South Africa. Choose from rye, wholegrain, or classic white bread starters — each one is a living culture ready to produce beautiful, naturally leavened loaves.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is a Sourdough Starter?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">A sourdough starter is a living ecosystem of wild yeast and lactic acid bacteria, cultivated in a simple mixture of flour and water. Unlike commercial baker's yeast, these natural cultures develop complex flavours and produce bread with a characteristic tangy taste, chewy texture, and crispy crust.</p>
          <p className="text-muted-foreground leading-relaxed">Sourdough is one of the oldest forms of leavened bread, dating back thousands of years. The long, slow fermentation not only creates incredible flavour but may also improve the nutritional profile and digestibility of the bread.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits of Sourdough</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Natural Leavening', desc: 'No commercial yeast needed — your starter provides all the rising power from wild yeast.' },
              { title: 'Better Flavour', desc: 'The slow fermentation develops complex, tangy flavours impossible to achieve with quick-rise yeast.' },
              { title: 'Improved Digestibility', desc: 'Long fermentation may break down gluten and phytic acid, making nutrients more bioavailable.' },
              { title: 'Zero Waste', desc: 'A single starter lasts forever with regular feeding — no need to keep buying yeast packets.' },
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
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Use Your Sourdough Starter</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li>When your starter arrives, feed it: discard half, add 50g flour + 50g water, mix</li>
            <li>Leave at room temperature (22–26°C) for 6–12 hours until bubbly and doubled</li>
            <li>Feed once more, then it's ready to bake with!</li>
            <li>Mix your dough: starter + flour + water + salt</li>
            <li>Stretch and fold every 30 minutes for 2 hours, then bulk ferment 4–8 hours</li>
            <li>Shape, proof overnight in the fridge, and bake at 230°C in a Dutch oven</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">Our starters are shipped as active cultures in sealed containers. They travel well and arrive ready to feed and bake with. Nationwide delivery: 2–5 business days. We export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Home bakers, bakeries, restaurants, and health food enthusiasts across all nine South African provinces. We also export to Botswana, Zambia, Zimbabwe, Namibia, and ship worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Sourdough Starter Online</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(p => <ProductCTACard key={p.url} {...p} />)}</div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/sourdough-starter" />
      </article>
    </PageShell>
  );
}

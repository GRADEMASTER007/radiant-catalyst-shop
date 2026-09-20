import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Apple Cider Vinegar Mother', url: 'https://livingculturehealth.com/product/apple-cider-vinegar-mother', description: 'Live apple cider vinegar mother culture. Brew your own raw, unfiltered ACV at home.' },
  { name: 'Red Wine Vinegar Mother', url: 'https://livingculturehealth.com/product/red-wine-vinegar-mother', description: 'Traditional red wine vinegar mother for rich, complex homemade vinegar.' },
  { name: 'White Wine Vinegar Mother', url: 'https://livingculturehealth.com/product/white-wine-vinegar-mother', description: 'Delicate white wine vinegar mother. Perfect for light dressings and marinades.' },
];

const faqs = [
  { question: 'What is a vinegar mother?', answer: 'A vinegar mother is a cellulose biofilm formed by acetic acid bacteria (Acetobacter). It converts alcohol (wine, cider, etc.) into acetic acid (vinegar) through natural fermentation. It looks like a gelatinous disc that floats on the liquid surface.' },
  { question: 'How do I make apple cider vinegar at home?', answer: 'Add your vinegar mother to raw, unpasteurised apple cider (or hard cider) in a wide-mouth jar. Cover with a cloth and leave in a warm, dark place for 2–4 weeks. Taste periodically — when it reaches your desired acidity, bottle it. The mother can be reused for the next batch.' },
  { question: 'Can I make vinegar from wine?', answer: 'Yes! Our red and white wine vinegar mothers are specifically designed to convert wine into vinegar. Simply add leftover wine to a jar with the mother culture and wait 3–6 weeks. It\'s a wonderful way to avoid wasting wine.' },
  { question: 'Do you ship vinegar mother cultures across South Africa?', answer: 'Absolutely. We ship from Gauteng to all South African provinces and export to Botswana, Zambia, Zimbabwe, Namibia, and internationally.' },
  { question: 'How do I store my vinegar mother?', answer: 'Keep your mother in vinegar at room temperature. It doesn\'t need refrigeration. If you\'re not actively making vinegar, just leave it in a jar of vinegar with a cloth cover — it will remain viable for months.' },
  { question: 'Is homemade apple cider vinegar as good as store-bought?', answer: 'Homemade ACV is often superior because it\'s raw, unfiltered, and unpasteurised, retaining the live mother culture. Commercial brands are often pasteurised, which kills the beneficial bacteria.' },
  { question: 'How long does it take to make vinegar?', answer: 'Depending on temperature and alcohol content, vinegar typically takes 2–6 weeks to develop. Warmer temperatures speed up the process. The vinegar is ready when it tastes properly acidic and the alcohol smell has disappeared.' },
  { question: 'Can I use the vinegar mother indefinitely?', answer: 'Yes! Like kefir grains, a vinegar mother is a living culture that continues to grow. It will produce new layers with each batch, and you can share the extras or start multiple jars simultaneously.' },
];

const productSchemas = products.map(p => ({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, url: p.url, brand: { '@type': 'Brand', name: 'Living Culture Health' } }));

export default function VinegarStarterCulture() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Vinegar Mother Cultures', url: 'https://livingculturehealth.com/vinegar-starter-culture' }]), faqJsonLd(faqs), ...productSchemas];
  return (
    <PageShell>
      <SEOHead title="Vinegar Mother South Africa | Apple Cider & Wine | Living Culture Health" description="Buy live vinegar mother cultures in South Africa. Apple cider, red wine & white wine vinegar mothers shipped from Gauteng. Make raw ACV at home." canonical="https://livingculturehealth.com/vinegar-starter-culture" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Vinegar Mother Cultures' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Vinegar Mother Cultures (Apple Cider & Wine)</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Make your own raw, unfiltered vinegar at home with our live <strong>vinegar mother cultures</strong>. Whether you want to brew <strong>apple cider vinegar</strong>, rich red wine vinegar, or delicate white wine vinegar, our cultures are shipped fresh from Gauteng to your door.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is a Vinegar Mother?</h2>
          <p className="text-muted-foreground leading-relaxed">A vinegar mother is a living colony of acetic acid bacteria (primarily Acetobacter) that converts alcohol into vinegar through aerobic fermentation. It forms a cellulose mat on the liquid surface and is the key ingredient in traditional vinegar-making. The mother is what makes raw vinegar "alive" — it contains beneficial bacteria and enzymes that pasteurised vinegar lacks.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Raw & Unfiltered', desc: 'Homemade vinegar retains the live mother culture and beneficial enzymes lost in commercial processing.' },
              { title: 'Cost-Effective', desc: 'One mother culture produces unlimited vinegar — just keep feeding it wine, cider, or fruit juice.' },
              { title: 'Zero Waste', desc: 'Turn leftover wine, bruised apples, or fruit scraps into gourmet vinegar instead of throwing them away.' },
              { title: 'Customisable', desc: 'Control the flavour, acidity, and ingredients. Add herbs, garlic, or fruits for infused vinegars.' },
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
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Make Vinegar at Home</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li>Choose your base: apple cider, red wine, white wine, or any alcoholic liquid (5–10% ABV is ideal)</li>
            <li>Pour into a wide-mouth glass or ceramic jar (oxygen exposure is essential)</li>
            <li>Gently place your vinegar mother on top of the liquid</li>
            <li>Cover with a cloth and secure — never seal airtight, as the bacteria need oxygen</li>
            <li>Store in a warm (20–30°C), dark place for 2–6 weeks</li>
            <li>Taste periodically until desired acidity is reached, then bottle and enjoy</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">Vinegar mothers are shipped in their vinegar liquid. They are extremely resilient cultures and ship well across South Africa and internationally. Delivery: 2–5 business days nationwide, with export available to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Home fermenters, chefs, health enthusiasts, and small-scale vinegar producers across all South African provinces. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Vinegar Mother Online</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(p => <ProductCTACard key={p.url} {...p} />)}</div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/vinegar-starter-culture" />
      </article>
    </PageShell>
  );
}

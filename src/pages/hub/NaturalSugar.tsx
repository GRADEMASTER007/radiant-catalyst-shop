import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Natural Brown Sugar 2kg', url: 'https://purelyhealthnutra.com/product/natural-brown-sugar-2kg', description: 'Premium unrefined natural brown sugar for water kefir, kombucha, and home fermentation. 2kg pack.' },
  { name: 'Natural Brown Sugar 10kg', url: 'https://purelyhealthnutra.com/product/natural-brown-sugar-10kg', description: 'Bulk 10kg natural brown sugar. Ideal for regular home brewers and small fermentation businesses.' },
  { name: 'Natural Brown Sugar 25kg', url: 'https://purelyhealthnutra.com/product/natural-brown-sugar-25kg', description: '25kg bag of unrefined natural brown sugar. Perfect for kombucha breweries and fermentation workshops.' },
  { name: 'Natural Brown Sugar 50kg', url: 'https://purelyhealthnutra.com/product/natural-brown-sugar-50kg', description: '50kg wholesale natural brown sugar. Best value for commercial fermenters, bakeries, and retailers.' },
];

const faqs = [
  { question: 'Why use natural brown sugar for fermentation?', answer: 'Natural brown sugar retains trace minerals (calcium, iron, potassium) from the sugar cane that nourish fermentation cultures like water kefir grains and kombucha SCOBYs. Refined white sugar is stripped of these nutrients, which can weaken cultures over time.' },
  { question: 'Can I use white sugar instead?', answer: 'You can use white sugar for fermentation, but natural brown sugar is preferred because it provides additional minerals that help cultures thrive. Many experienced fermenters report healthier, faster-growing grains when using unrefined sugar.' },
  { question: 'Is this sugar suitable for water kefir?', answer: 'Absolutely! Natural brown sugar is the ideal fuel for water kefir grains. The minerals in unrefined sugar feed the bacteria and yeasts in the grains, producing a more robust and flavourful ferment.' },
  { question: 'Do you sell sugar in bulk?', answer: 'Yes, we offer natural brown sugar in 2kg, 10kg, 25kg, and 50kg bags. Bulk pricing is available for commercial brewers, bakeries, health food stores, and fermentation businesses.' },
  { question: 'Do you ship sugar across South Africa?', answer: 'Yes, we ship from Gauteng to all nine South African provinces. Bulk orders may qualify for discounted freight rates. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.' },
  { question: 'Is this sugar organic?', answer: 'Our natural brown sugar is unrefined and minimally processed, retaining its natural molasses and minerals. While it may not carry a formal organic certification, it is free from bleaching agents and artificial additives.' },
  { question: 'What is the difference between natural brown sugar and commercial brown sugar?', answer: 'True natural brown sugar is made by partially refining sugar cane, leaving the natural molasses intact. Commercial "brown sugar" is often just white sugar with molasses added back — a very different product. Our sugar is genuinely unrefined.' },
  { question: 'Can I use this sugar for baking?', answer: 'Of course! Natural brown sugar is excellent for baking, adding moisture, colour, and a rich caramel flavour to cakes, cookies, and breads. It\'s also perfect for making caramel, sauces, and marinades.' },
];

const productSchemas = products.map(p => ({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, url: p.url, brand: { '@type': 'Brand', name: 'Purely Health Nutra' } }));

export default function NaturalSugar() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Natural Brown Sugar', url: 'https://purelyhealthnutra.com/natural-sugar' }]), faqJsonLd(faqs), ...productSchemas];
  return (
    <PageShell>
      <SEOHead title="Natural Brown Sugar South Africa | Fermentation Sugar | Purely Health Nutra" description="Buy natural brown sugar in South Africa. Unrefined fermentation sugar for water kefir, kombucha & baking. 2kg to 50kg bags shipped from Gauteng." canonical="https://purelyhealthnutra.com/natural-sugar" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Natural Brown Sugar' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Natural Brown Sugar in South Africa</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Premium unrefined <strong>natural brown sugar</strong> — the preferred fuel for water kefir, kombucha, and all your fermentation projects. Available in sizes from 2kg to 50kg, shipped from Gauteng across South Africa and internationally.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is Natural Brown Sugar?</h2>
          <p className="text-muted-foreground leading-relaxed">Natural brown sugar is minimally processed sugar cane that retains its natural molasses coating. Unlike commercial brown sugar (which is often white sugar with molasses added back), genuine natural brown sugar contains trace minerals like calcium, iron, magnesium, and potassium — all vital nutrients for healthy fermentation cultures.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Why Fermenters Prefer Natural Brown Sugar</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Mineral-Rich', desc: 'Trace minerals nourish water kefir grains and kombucha SCOBYs, promoting healthy growth and robust fermentation.' },
              { title: 'Better Flavour', desc: 'The natural molasses adds depth and complexity to fermented beverages — a richer, more rounded taste.' },
              { title: 'Unrefined & Chemical-Free', desc: 'No bleaching agents, no artificial processing. Just pure, minimally processed sugar cane.' },
              { title: 'Versatile', desc: 'Perfect for fermentation, baking, cooking, and making caramel or sauces.' },
            ].map(b => (
              <div key={b.title} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Use for Fermentation</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li><strong>Water Kefir:</strong> Dissolve 2–3 tablespoons per 500ml of water. The minerals in the sugar are essential for healthy grains.</li>
            <li><strong>Kombucha:</strong> Use 70–80g per litre of brewed tea. The sugar feeds the SCOBY during fermentation.</li>
            <li><strong>Jun Tea:</strong> Replace sugar with honey for jun, but use brown sugar for standard kombucha.</li>
            <li><strong>Ginger Bug:</strong> Feed your ginger bug starter with 1 tablespoon daily of natural brown sugar and grated ginger.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">Store in a cool, dry place in an airtight container. Shelf life is indefinite when stored properly. We ship all sizes from Gauteng — from 2kg home-use packs to 50kg commercial bags. Delivery: 2–5 business days nationwide. Export available to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Home fermenters, kombucha breweries, bakeries, health food stores, restaurants, and retailers across all nine South African provinces. Bulk and wholesale pricing available. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Natural Brown Sugar Online</h2>
          <div className="grid sm:grid-cols-2 gap-6">{products.map(p => <ProductCTACard key={p.url} {...p} />)}</div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/natural-sugar" />
      </article>
    </PageShell>
  );
}

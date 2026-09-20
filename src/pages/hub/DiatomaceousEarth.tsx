import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Diatomaceous Earth 1kg', url: 'https://livingculturehealth.com/product/diatomaceous-earth-1kg', description: 'Food grade diatomaceous earth in a convenient 1kg pack. Ideal for home use.' },
  { name: 'Diatomaceous Earth 10kg', url: 'https://livingculturehealth.com/product/diatomaceous-earth-10kg', description: '10kg bag of food grade diatomaceous earth. Great for garden, homestead, and pet care.' },
  { name: 'Diatomaceous Earth 25kg', url: 'https://livingculturehealth.com/product/diatomaceous-earth-25kg', description: '25kg bulk bag of food grade diatomaceous earth. Best value for farms and larger properties.' },
];

const faqs = [
  { question: 'What is diatomaceous earth?', answer: 'Diatomaceous earth (DE) is a naturally occurring sedimentary rock made from the fossilised remains of diatoms — tiny aquatic organisms with silica-based shells. When ground into a fine powder, it has a wide variety of uses in agriculture, pest control, and household applications.' },
  { question: 'What does "food grade" mean?', answer: 'Food grade diatomaceous earth meets strict purity standards, containing less than 1% crystalline silica. It is safe for use around food, animals, and in agricultural applications. Do not confuse it with industrial-grade (pool-grade) DE, which is chemically treated and NOT safe for food contact.' },
  { question: 'How is diatomaceous earth used in the garden?', answer: 'DE can be dusted on plants and soil as a natural, non-toxic pest deterrent. Its abrasive microscopic particles damage the exoskeletons of insects like ants, fleas, bed bugs, and aphids. It works mechanically, not chemically, so pests cannot develop resistance.' },
  { question: 'Can diatomaceous earth be used for animals?', answer: 'Many farmers and pet owners use food grade DE as a natural supplement mixed into animal feed, or dusted on fur/feathers as a pest deterrent. Always use food grade DE around animals, never pool-grade. Consult your veterinarian for specific dosage guidance.' },
  { question: 'Do you ship diatomaceous earth across South Africa?', answer: 'Yes! We ship from Gauteng to all nine South African provinces. Bulk orders (10kg and 25kg) may qualify for discounted freight. We also export to Botswana, Zambia, Zimbabwe, Namibia, and internationally.' },
  { question: 'How should I store diatomaceous earth?', answer: 'Store DE in a dry, sealed container. It has an indefinite shelf life as long as it stays dry. Moisture will reduce its effectiveness but won\'t make it go bad — just dry it out and it\'s good as new.' },
  { question: 'Is diatomaceous earth safe to handle?', answer: 'Food grade DE is generally safe, but the fine powder can irritate the eyes and lungs if inhaled in large quantities. Wear a dust mask when applying in enclosed spaces, and avoid getting it in your eyes. It is non-toxic and chemical-free.' },
  { question: 'What sizes do you sell?', answer: 'We offer food grade diatomaceous earth in 1kg (home use), 10kg (garden and homestead), and 25kg (farms and bulk users) bags. Contact us for larger wholesale quantities.' },
];

const productSchemas = products.map(p => ({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, url: p.url, brand: { '@type': 'Brand', name: 'Living Culture Health' } }));

export default function DiatomaceousEarth() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Diatomaceous Earth', url: 'https://livingculturehealth.com/diatomaceous-earth' }]), faqJsonLd(faqs), ...productSchemas];
  return (
    <PageShell>
      <SEOHead title="Diatomaceous Earth South Africa | Food Grade | Living Culture Health" description="Buy food grade diatomaceous earth in South Africa. 1kg, 10kg & 25kg bags shipped from Gauteng. Natural pest control for garden, home & farm." canonical="https://livingculturehealth.com/diatomaceous-earth" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Diatomaceous Earth' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Food Grade Diatomaceous Earth in South Africa</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Premium <strong>food grade diatomaceous earth</strong> for natural pest control, garden care, and agricultural applications. Available in 1kg, 10kg, and 25kg bags, shipped from Gauteng across South Africa and internationally.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is Diatomaceous Earth?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Diatomaceous earth (DE) is a fine, off-white powder made from the fossilised remains of diatoms — microscopic aquatic organisms. These ancient organisms had shells made of silica, and over millions of years, their remains accumulated into thick deposits of soft sedimentary rock.</p>
          <p className="text-muted-foreground leading-relaxed">When ground into powder, DE has remarkable properties: it's highly absorbent, mildly abrasive at the microscopic level, and completely non-toxic. This makes it invaluable for natural pest control, soil improvement, and many household applications.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Uses & Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Natural Pest Control', desc: 'Mechanically damages insect exoskeletons — effective against ants, fleas, bed bugs, aphids, and more. No chemical resistance possible.' },
              { title: 'Garden & Soil Health', desc: 'Improves soil aeration and drainage. Can be mixed into compost or applied directly to garden beds.' },
              { title: 'Animal Care', desc: 'Used by farmers and pet owners as a natural supplement and pest deterrent for livestock, poultry, and pets.' },
              { title: 'Household Uses', desc: 'Natural deodoriser, gentle abrasive cleaner, and moisture absorber. Versatile and chemical-free.' },
            ].map(b => (
              <div key={b.title} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">Disclaimer: Always use food grade DE. This product is sold for agricultural and household use. Consult a professional for specific applications.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Use</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li><strong>Pest control:</strong> Lightly dust around foundations, doorways, pet bedding, and garden plants. Reapply after rain.</li>
            <li><strong>Garden:</strong> Mix 1–2 cups per square metre into topsoil, or dust directly on plant leaves to deter crawling insects.</li>
            <li><strong>Poultry/Livestock:</strong> Mix into feed (2% by weight) or dust into bedding/coops as a natural pest deterrent.</li>
            <li><strong>Storage:</strong> Add a thin layer in grain storage bins to absorb moisture and deter weevils.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">Store in a dry location. DE has an indefinite shelf life. We ship from Gauteng to all provinces — 1kg by courier, 10kg and 25kg by freight or courier. Export available to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">Homeowners, gardeners, smallholders, poultry farmers, pet owners, and commercial farms across all nine South African provinces. Bulk pricing available. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Diatomaceous Earth Online</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(p => <ProductCTACard key={p.url} {...p} />)}</div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/diatomaceous-earth" />
      </article>
    </PageShell>
  );
}

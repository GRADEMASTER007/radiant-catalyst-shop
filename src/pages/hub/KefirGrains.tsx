import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Water Kefir Grains', url: 'https://purelyhealthnutra.com/product/water-kefir-grains', description: 'Live water kefir grains ready to ferment. Dairy-free probiotic starter for sparkling probiotic drinks.' },
  { name: 'Milk Kefir Grains', url: 'https://purelyhealthnutra.com/product/milk-kefir-grains', description: 'Authentic live milk kefir grains for homemade probiotic kefir. Rich in beneficial bacteria and yeasts.' },
  { name: 'Water Kefir Grains Starter Kit', url: 'https://purelyhealthnutra.com/product/water-kefir-grains-starter-kit', description: 'Everything you need to start brewing water kefir at home. Includes grains, sugar, and instructions.' },
  { name: 'Milk Kefir Grains Starter Kit', url: 'https://purelyhealthnutra.com/product/milk-kefir-grains-starter-kit', description: 'Complete milk kefir starter kit with live grains, strainer, and brewing guide.' },
  { name: 'Water Kefir Grains Bulk 10-Pack', url: 'https://purelyhealthnutra.com/product/water-kefir-grains-bulk-10-pack', description: 'Bulk water kefir grains for practitioners, retailers, and health shops across South Africa.' },
];

const faqs = [
  { question: 'What are kefir grains?', answer: 'Kefir grains are living symbiotic cultures of bacteria and yeasts (SCOBY) that ferment milk or sugar water into a probiotic-rich beverage. They look like small, translucent, cauliflower-like clusters and can be reused indefinitely with proper care.' },
  { question: 'What is the difference between water kefir and milk kefir?', answer: 'Water kefir grains ferment sugar water or fruit juice into a dairy-free, fizzy probiotic drink. Milk kefir grains ferment cow, goat, or plant milk into a thick, tangy, yogurt-like drink. Both provide beneficial probiotics but suit different dietary preferences.' },
  { question: 'Do you ship kefir grains across South Africa?', answer: 'Yes! We ship live kefir grains to all nine provinces: Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, and Northern Cape. We also export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide.' },
  { question: 'How do I activate kefir grains after delivery?', answer: 'For water kefir: dissolve 2 tablespoons of natural brown sugar in 500ml water, add your grains, cover with a cloth, and ferment for 24–48 hours at room temperature. For milk kefir: place grains in 500ml of fresh milk, cover, and ferment for 12–24 hours. Discard the first 1–2 batches as the grains adjust.' },
  { question: 'How long do kefir grains last?', answer: 'With proper care, kefir grains last indefinitely and actually grow over time. They are living cultures that multiply, so you can share extras with friends or use them for larger batches.' },
  { question: 'Can I use kefir grains with plant-based milk?', answer: 'Milk kefir grains can ferment coconut milk, almond milk, and other plant milks, though they may need to be refreshed in dairy milk periodically (every 3–4 batches) to maintain their health. Water kefir grains are naturally dairy-free.' },
  { question: 'Are your kefir grains organic?', answer: 'Our kefir grains are grown in a natural, chemical-free environment. While we don\'t carry formal organic certification, they are cultivated without preservatives, additives, or artificial ingredients.' },
  { question: 'What does kefir taste like?', answer: 'Water kefir tastes like a mildly sweet, fizzy lemonade and can be flavoured with fruit juice. Milk kefir has a tangy, slightly sour taste similar to thin yogurt or buttermilk. Both are refreshing and can be adjusted to your preference.' },
  { question: 'Can I buy kefir grains in Gauteng?', answer: 'Absolutely! We are based in Gauteng and offer fast delivery across Johannesburg, Pretoria, and surrounding areas. Most Gauteng orders arrive within 1–2 business days.' },
  { question: 'Is kefir safe during pregnancy or for children?', answer: 'Kefir is generally considered safe and is consumed worldwide by people of all ages, including children and pregnant women. However, we recommend consulting your healthcare provider before making dietary changes. Disclaimer: Our products are not intended to diagnose, treat, cure, or prevent any disease.' },
];

const productSchemas = products.map(p => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.name,
  description: p.description,
  url: p.url,
  brand: { '@type': 'Brand', name: 'Purely Health Nutra' },
}));

export default function KefirGrains() {
  const jsonLd = [
    breadcrumbJsonLd([{ name: 'Kefir Grains', url: 'https://purelyhealthnutra.com/kefir-grains' }]),
    faqJsonLd(faqs),
    ...productSchemas,
  ];

  return (
    <PageShell>
      <SEOHead
        title="Kefir Grains South Africa | Milk & Water Kefir | Purely Health Nutra"
        description="Buy live kefir grains in South Africa. Water kefir & milk kefir grains shipped from Gauteng nationwide. Natural probiotics & live cultures for gut health."
        canonical="https://purelyhealthnutra.com/kefir-grains"
        jsonLd={jsonLd}
      />
      <Breadcrumbs items={[{ label: 'Kefir Grains' }]} />

      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
          Kefir Grains in South Africa (Milk & Water Kefir)
        </h1>

        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Discover the ancient art of kefir-making with our premium live kefir grains, shipped fresh from Gauteng to every corner of South Africa and beyond. Whether you're looking for <strong>water kefir grains</strong> for a refreshing dairy-free probiotic soda, or <strong>milk kefir grains</strong> for a thick, creamy cultured drink, we have you covered.
        </p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Are Kefir Grains?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Kefir grains are not actually "grains" in the cereal sense — they are living symbiotic colonies of bacteria and yeasts (known as a SCOBY) that have been used for centuries to ferment beverages. Originating from the Caucasus Mountains, these remarkable cultures transform ordinary milk or sugar water into a potent probiotic drink containing billions of beneficial microorganisms.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            At Purely Health Nutra, we supply two main types: <strong>milk kefir grains</strong> (which ferment dairy or plant milk) and <strong>water kefir grains</strong> (also called tibicos, which ferment sugar water). Both are available as individual cultures or as complete starter kits with everything you need.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits of Kefir</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Rich in Probiotics', desc: 'Kefir contains up to 61 strains of bacteria and yeasts, making it one of the most diverse probiotic foods available.' },
              { title: 'Supports Digestive Health', desc: 'The live cultures in kefir may help maintain a healthy gut microbiome and support comfortable digestion.' },
              { title: 'Easy to Make at Home', desc: 'Simply add grains to milk or sugar water, wait 24–48 hours, and strain. No special equipment needed.' },
              { title: 'Cost-Effective', desc: 'Kefir grains multiply over time, giving you an unlimited supply of probiotic drinks for a once-off purchase.' },
            ].map(b => (
              <div key={b.title} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Disclaimer: These statements have not been evaluated by SAHPRA. This product is not intended to diagnose, treat, cure, or prevent any disease.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Activate & Care for Your Kefir Grains</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Water Kefir</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Dissolve 2–3 tablespoons of natural brown sugar in 500ml of non-chlorinated water</li>
                <li>Let the water cool to room temperature, then add your water kefir grains</li>
                <li>Cover with a cloth or coffee filter (not airtight) and leave for 24–48 hours</li>
                <li>Strain the grains and enjoy your fizzy probiotic drink. Add fruit juice for a second fermentation!</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Milk Kefir</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Place milk kefir grains into 500ml of fresh whole milk (cow, goat, or coconut)</li>
                <li>Cover loosely and leave at room temperature for 12–24 hours</li>
                <li>When the milk has thickened, strain out the grains and refrigerate your kefir</li>
                <li>Repeat daily — your grains will grow and multiply!</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Our kefir grains are shipped in their active fermentation liquid, carefully packaged to maintain viability during transit. Most South African orders arrive within 2–5 business days depending on your province.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>For export orders</strong> to Botswana, Zambia, Zimbabwe, Namibia, and international destinations: we use expedited shipping with temperature-stable packaging. Contact us for export shipping rates.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">
            We deliver kefir grains to all nine South African provinces — Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, and Northern Cape. We also export to <strong>Botswana, Zambia, Zimbabwe, Namibia</strong>, and ship worldwide. Whether you're a home fermenter, health practitioner, retail store, or restaurant, we supply kefir grains in quantities that suit your needs.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Kefir Grains Online</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => <ProductCTACard key={p.url} {...p} />)}
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/kefir-grains" />
      </article>
    </PageShell>
  );
}

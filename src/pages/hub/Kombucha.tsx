import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ProductCTACard } from '@/components/seo/ProductCTACard';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';

const products = [
  { name: 'Rooibos Kombucha SCOBY', url: 'https://livingculturehealth.com/product/rooibos-kombucha-scoby', description: 'Uniquely South African — a live SCOBY adapted to brew antioxidant-rich rooibos kombucha.' },
  { name: 'Black Tea Kombucha SCOBY', url: 'https://livingculturehealth.com/product/black-tea-kombucha-scoby', description: 'Classic kombucha SCOBY for brewing traditional black tea kombucha. Robust and fast-fermenting.' },
  { name: 'Green Tea Kombucha SCOBY', url: 'https://livingculturehealth.com/product/green-tea-kombucha-scoby', description: 'Lighter, more delicate kombucha from green tea. Rich in polyphenols and gentle on the palate.' },
  { name: 'Coffee Kombucha SCOBY', url: 'https://livingculturehealth.com/product/coffee-kombucha-scoby', description: 'Brew probiotic coffee kombucha at home. A unique twist on the classic fermented tea.' },
];

const faqs = [
  { question: 'What is a SCOBY?', answer: 'SCOBY stands for Symbiotic Culture of Bacteria and Yeast. It\'s the living culture used to ferment sweetened tea into kombucha. It looks like a thick, rubbery pancake and grows a new layer with each batch.' },
  { question: 'Can I brew kombucha with rooibos tea?', answer: 'Yes! Rooibos kombucha is a uniquely South African drink. Our Rooibos Kombucha SCOBY is specifically adapted to ferment rooibos tea, producing a caffeine-free, antioxidant-rich probiotic beverage.' },
  { question: 'How long does kombucha take to ferment?', answer: 'A typical first fermentation takes 7–14 days at room temperature, depending on the ambient temperature and your taste preference. Warmer climates (like many parts of South Africa) tend to speed up fermentation.' },
  { question: 'Do you ship SCOBY cultures throughout South Africa?', answer: 'Yes, we ship live SCOBY cultures to all provinces in South Africa from our base in Gauteng. We also export to Botswana, Zambia, Zimbabwe, Namibia, and internationally.' },
  { question: 'How do I care for my SCOBY?', answer: 'Keep your SCOBY in freshly brewed, sweetened tea at room temperature. Feed it with a new batch of sweetened tea every 1–2 weeks. If taking a break, store it in a SCOBY hotel (a jar of kombucha) in a cool, dark place.' },
  { question: 'Is kombucha safe to drink?', answer: 'Kombucha has been consumed safely for centuries. However, it contains small amounts of naturally occurring alcohol and acids. Pregnant women, immunocompromised individuals, and children should consult a healthcare provider. Disclaimer: Our products are not intended to diagnose, treat, cure, or prevent any disease.' },
  { question: 'What does kombucha taste like?', answer: 'Kombucha has a tangy, slightly vinegary taste with light effervescence. The flavour varies by tea base — black tea kombucha is bold, green tea is lighter, rooibos is earthy and sweet, and coffee kombucha has a rich, complex profile.' },
  { question: 'Can I flavour my kombucha?', answer: 'Absolutely! After the first fermentation, bottle your kombucha with fruit juice, ginger, berries, or herbs for a second fermentation (2–3 days). This adds carbonation and flavour.' },
];

const productSchemas = products.map(p => ({
  '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, url: p.url, brand: { '@type': 'Brand', name: 'Living Culture Health' },
}));

export default function Kombucha() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'Kombucha', url: 'https://livingculturehealth.com/kombucha' }]), faqJsonLd(faqs), ...productSchemas];
  return (
    <PageShell>
      <SEOHead title="Kombucha SCOBY South Africa | Live Culture | Living Culture Health" description="Buy live kombucha SCOBY cultures in South Africa. Rooibos, black tea, green tea & coffee SCOBY shipped from Gauteng nationwide and worldwide." canonical="https://livingculturehealth.com/kombucha" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Kombucha SCOBY' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Kombucha SCOBY in South Africa (Live Culture)</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Brew your own probiotic-rich kombucha at home with our live SCOBY cultures, shipped fresh from Gauteng across South Africa and internationally. Choose from classic black tea, delicate green tea, uniquely South African <strong>rooibos</strong>, or adventurous <strong>coffee kombucha</strong> SCOBYs.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What Is Kombucha?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Kombucha is a fermented tea beverage made by adding a SCOBY (Symbiotic Culture of Bacteria and Yeast) to sweetened tea. Over 7–14 days, the culture transforms the tea into a fizzy, tangy, probiotic drink loaded with beneficial organic acids, B vitamins, and live microorganisms.</p>
          <p className="text-muted-foreground leading-relaxed">It has been enjoyed for thousands of years across Asia and Eastern Europe, and is now one of the fastest-growing health beverages in South Africa. Making kombucha at home is simple, affordable, and allows you to control the ingredients and sugar content.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Benefits of Kombucha</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Probiotic-Rich', desc: 'Contains live beneficial bacteria that may support gut health and digestion.' },
              { title: 'Antioxidant Properties', desc: 'Especially when brewed with rooibos or green tea, kombucha retains the antioxidant benefits of the base tea.' },
              { title: 'Low Sugar Alternative', desc: 'Home-brewed kombucha can be much lower in sugar than commercial sodas and juices.' },
              { title: 'Versatile Flavours', desc: 'Experiment with fruits, herbs, and spices during second fermentation for endless flavour combinations.' },
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
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How to Brew Kombucha</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed ml-2">
            <li>Brew 1 litre of tea (black, green, rooibos, or coffee) and dissolve 80g of sugar while hot</li>
            <li>Let the tea cool completely to room temperature</li>
            <li>Pour into a wide-mouth glass jar and add your SCOBY with 100ml of starter liquid</li>
            <li>Cover with a cloth and secure with a rubber band — never seal airtight</li>
            <li>Ferment for 7–14 days at room temperature (21–29°C is ideal)</li>
            <li>Taste periodically — when it reaches your preferred tartness, bottle and refrigerate</li>
            <li>Optional: add fruit, ginger, or herbs for a fizzy second fermentation (2–3 days)</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Storage & Shipping</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">Our SCOBYs are shipped in their starter liquid, vacuum-sealed for freshness. They are resilient cultures that handle transit well. Nationwide South African delivery typically takes 2–5 business days.</p>
          <p className="text-muted-foreground leading-relaxed">We export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide. Contact us for international shipping rates.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Who We Serve</h2>
          <p className="text-muted-foreground leading-relaxed">We ship to all nine South African provinces and export to Botswana, Zambia, Zimbabwe, Namibia, and worldwide. Home brewers, health food stores, restaurants, wellness practitioners — everyone is welcome.</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Buy Kombucha SCOBY Online</h2>
          <div className="grid sm:grid-cols-2 gap-6">{products.map(p => <ProductCTACard key={p.url} {...p} />)}</div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/kombucha" />
      </article>
    </PageShell>
  );
}

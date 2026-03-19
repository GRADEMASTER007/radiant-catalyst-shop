import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { FAQSection, faqJsonLd } from '@/components/seo/FAQSection';
import { ContentHubLinks } from '@/components/seo/ContentHubLinks';
import { PageShell } from '@/components/seo/PageShell';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { MessageCircle, HelpCircle, Truck, Leaf } from 'lucide-react';

const faqs = [
  { question: 'What can the AI assistant help me with?', answer: 'Our AI assistant can help you choose the right cultures for your needs, answer questions about fermentation, provide shipping information, suggest products based on your goals, and connect you with our team via WhatsApp or email.' },
  { question: 'Is the AI assistant available 24/7?', answer: 'Yes, the AI assistant is available around the clock. For more complex queries or order issues, it will connect you with our human team during business hours.' },
  { question: 'Can the assistant help me choose a starter culture?', answer: 'Absolutely! Tell the assistant what you want to make (kefir, kombucha, sourdough, vinegar, etc.) and it will recommend the right products, quantities, and accessories for your needs.' },
  { question: 'How do I contact you via WhatsApp?', answer: 'You can reach us on WhatsApp at +27 83 447 4639. Alternatively, click the WhatsApp button on any page or ask the AI assistant to connect you.' },
  { question: 'Can I track my order through the assistant?', answer: 'Yes, you can ask the assistant about your order status. For detailed tracking, visit our Track Order page or contact us directly.' },
  { question: 'What if I have a problem with my order?', answer: 'The assistant can help with common order issues. For urgent matters, contact us directly at admin@proagrisa.co.za or +27 83 447 4639.' },
  { question: 'Does the assistant know about shipping to other countries?', answer: 'Yes! The assistant can provide shipping information for all South African provinces as well as Botswana, Zambia, Zimbabwe, Namibia, and international destinations.' },
  { question: 'Is my conversation private?', answer: 'Yes, your conversation with the AI assistant is private and not shared with third parties. We use the interaction data solely to improve our customer service.' },
];

export default function AssistantPage() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'AI Assistant', url: 'https://purelyhealthnutra.com/assistant' }]), faqJsonLd(faqs)];
  return (
    <PageShell>
      <SEOHead title="AI Shopping Assistant | Purely Health Nutra South Africa" description="Get personalised help choosing probiotic cultures, fermentation starters & natural health products. AI assistant + WhatsApp support from Gauteng." canonical="https://purelyhealthnutra.com/assistant" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">AI Shopping Assistant</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Need help choosing the right culture, figuring out shipping, or getting started with fermentation? Our <strong>AI assistant</strong> is here to guide you — available 24/7 right here on the site, or connect with us via WhatsApp for personal support.</p>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">How Can We Help?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Leaf, title: 'Choose Your Culture', desc: 'Not sure whether you need water kefir, milk kefir, kombucha, or sourdough? The assistant will help you pick based on your goals and dietary preferences.' },
              { icon: HelpCircle, title: 'Fermentation Guidance', desc: 'Get step-by-step instructions for activating cultures, troubleshooting fermentation issues, and perfecting your recipes.' },
              { icon: Truck, title: 'Shipping & Delivery', desc: 'Check shipping options, delivery times, and export availability for your province or country.' },
              { icon: MessageCircle, title: 'WhatsApp Support', desc: 'Prefer to chat with a human? Connect with our team on WhatsApp at +27 83 447 4639 for personal assistance.' },
            ].map(f => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Contact Us Directly</h2>
          <div className="bg-muted/50 rounded-xl p-6 space-y-3">
            <p className="text-muted-foreground"><strong>WhatsApp:</strong> <a href="https://wa.me/27834474639" className="text-primary hover:underline">+27 83 447 4639</a></p>
            <p className="text-muted-foreground"><strong>Email:</strong> <a href="mailto:admin@proagrisa.co.za" className="text-primary hover:underline">admin@proagrisa.co.za</a></p>
            <p className="text-muted-foreground"><strong>International:</strong> +1 351 777 2848</p>
          </div>
        </section>

        <FAQSection faqs={faqs} />
        <ContentHubLinks currentPath="/assistant" />
      </article>
      <AIAssistantWidget />
    </PageShell>
  );
}

interface FAQ {
  question: string;
  answer: string;
}

export function FAQSection({ faqs }: { faqs: FAQ[] }) {
  return (
    <section className="py-12">
      <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground text-lg mb-3">{faq.question}</h3>
            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

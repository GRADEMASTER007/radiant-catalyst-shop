import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/seo/Breadcrumbs';
import { PageShell } from '@/components/seo/PageShell';
import { ExternalLink } from 'lucide-react';

const checklist = [
  {
    title: 'Google Search Console',
    items: [
      { label: 'Verify site ownership', note: 'Add the Google verification meta tag or HTML file to your site root. Current file: /google0ff5659067fd18f2.html' },
      { label: 'Submit sitemap', note: 'Go to Sitemaps → Add new sitemap → enter: https://purelyhealthnutra.com/sitemap.xml', link: 'https://search.google.com/search-console' },
      { label: 'Request indexing for key pages', note: 'Use URL Inspection tool → paste each page URL → click "Request Indexing"' },
    ],
  },
  {
    title: 'Bing Webmaster Tools',
    items: [
      { label: 'Verify site ownership', note: 'Bing verification meta tag is in index.html: <meta name="msvalidate.01" content="4F91CFFF8DBE928900561451DF26E496" />' },
      { label: 'Submit sitemap', note: 'Go to Sitemaps → Submit sitemap → enter: https://purelyhealthnutra.com/sitemap.xml', link: 'https://www.bing.com/webmasters' },
      { label: 'Use IndexNow for instant indexing', note: 'Bing supports IndexNow protocol. Use the admin SEO tools to submit URLs via IndexNow for near-instant indexing.' },
    ],
  },
  {
    title: 'Structured Data Testing',
    items: [
      { label: 'Test with Google Rich Results', note: 'Paste any page URL to validate JSON-LD schema (Organization, FAQPage, BreadcrumbList, Product)', link: 'https://search.google.com/test/rich-results' },
      { label: 'Test with Schema Markup Validator', note: 'Alternative validator for all schema types', link: 'https://validator.schema.org/' },
    ],
  },
  {
    title: 'Content Hub Pages',
    items: [
      { label: '/kefir-grains — Kefir Grains page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/kombucha — Kombucha SCOBY page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/sourdough-starter — Sourdough page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/vinegar-starter-culture — Vinegar page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/natural-sugar — Natural Sugar page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/natural-probiotics — Probiotics page live', note: 'Verify: canonical, meta tags, FAQ schema' },
      { label: '/sauerkraut — Sauerkraut page live', note: 'Verify: canonical, meta tags, FAQ schema' },
      { label: '/diatomaceous-earth — DE page live', note: 'Verify: canonical, meta tags, FAQ schema, product schema' },
      { label: '/assistant — AI Assistant page live', note: 'Verify: canonical, meta tags, FAQ schema' },
    ],
  },
  {
    title: 'Technical SEO',
    items: [
      { label: 'robots.txt accessible', note: 'Verify at https://purelyhealthnutra.com/robots.txt' },
      { label: 'sitemap.xml accessible', note: 'Verify at https://purelyhealthnutra.com/sitemap.xml' },
      { label: 'All pages have canonical tags', note: 'Each page has a self-referencing <link rel="canonical"> tag' },
      { label: 'All pages have meta robots index,follow', note: 'Set via SEOHead component on each page' },
      { label: 'Open Graph + Twitter cards on every page', note: 'Unique title, description, image per page' },
    ],
  },
];

export default function SEOChecklist() {
  const jsonLd = [breadcrumbJsonLd([{ name: 'SEO Checklist', url: 'https://purelyhealthnutra.com/seo-checklist' }])];
  return (
    <PageShell>
      <SEOHead title="SEO Launch Checklist | Purely Health Nutra" description="Post-launch SEO verification checklist for Purely Health Nutra. Google Search Console, Bing Webmaster Tools, structured data testing & indexing." canonical="https://purelyhealthnutra.com/seo-checklist" jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'SEO Checklist' }]} />
      <article>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">SEO Launch Checklist</h1>
        <p className="text-lg text-muted-foreground mb-8">Post-launch verification checklist for search engine indexing and structured data validation.</p>

        <div className="space-y-10">
          {checklist.map(section => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                            Open Tool <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}

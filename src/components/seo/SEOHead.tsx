import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object[];
}

export function SEOHead({ title, description, canonical, ogImage = 'https://livingculturehealth.com/og-image.png', jsonLd = [] }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', description);
    setMeta('robots', 'index, follow');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'Living Culture Health', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    // JSON-LD
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach(s => s.remove());

    // Global Organization schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Living Culture Health',
      url: 'https://livingculturehealth.com',
      logo: 'https://livingculturehealth.com/og-image.png',
      description: 'South Africa\'s trusted supplier of live probiotic cultures, fermentation starters, and natural health products. Based in Gauteng, shipping nationwide and worldwide.',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Gauteng',
        addressCountry: 'ZA',
      },
      areaServed: [
        { '@type': 'Country', name: 'South Africa' },
        { '@type': 'Country', name: 'Botswana' },
        { '@type': 'Country', name: 'Zambia' },
        { '@type': 'Country', name: 'Zimbabwe' },
        { '@type': 'Country', name: 'Namibia' },
        { '@type': 'Country', name: 'Worldwide' },
      ],
      contactPoint: [
        { '@type': 'ContactPoint', contactType: 'customer service', telephone: '+27834474639', availableLanguage: 'English' },
        { '@type': 'ContactPoint', contactType: 'customer service', email: 'admin@proagrisa.co.za' },
      ],
      sameAs: [],
    };

    const webSiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Living Culture Health',
      url: 'https://livingculturehealth.com',
    };

    const allSchemas = [orgSchema, webSiteSchema, ...jsonLd];
    allSchemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(s => s.remove());
    };
  }, [title, description, canonical, ogImage, jsonLd]);

  return null;
}

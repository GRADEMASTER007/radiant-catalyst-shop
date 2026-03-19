import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const hubPages = [
  { path: '/kefir-grains', label: 'Kefir Grains (Milk & Water)' },
  { path: '/kombucha', label: 'Kombucha SCOBY Cultures' },
  { path: '/sourdough-starter', label: 'Sourdough Starter Cultures' },
  { path: '/vinegar-starter-culture', label: 'Vinegar Mother Cultures' },
  { path: '/natural-sugar', label: 'Natural Brown Sugar' },
  { path: '/natural-probiotics', label: 'Natural Probiotics & Live Cultures' },
  { path: '/sauerkraut', label: 'Sauerkraut & Fermentation' },
  { path: '/diatomaceous-earth', label: 'Diatomaceous Earth' },
  { path: '/assistant', label: 'AI Shopping Assistant' },
];

export function ContentHubLinks({ currentPath }: { currentPath: string }) {
  const filtered = hubPages.filter(p => p.path !== currentPath);
  return (
    <section className="py-12">
      <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Explore Our Range</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(page => (
          <Link
            key={page.path}
            to={page.path}
            className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors group"
          >
            <span className="text-foreground font-medium group-hover:text-primary transition-colors">{page.label}</span>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </section>
  );
}

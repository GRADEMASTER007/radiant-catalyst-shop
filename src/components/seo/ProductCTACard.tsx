import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCTACardProps {
  name: string;
  url: string;
  description: string;
}

export function ProductCTACard({ name, url, description }: ProductCTACardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <h3 className="font-serif text-lg font-bold text-foreground mb-2">{name}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          Buy Online <ArrowRight className="w-4 h-4" />
        </Button>
      </a>
    </div>
  );
}

import { motion } from 'motion/react';
import { Globe, Truck, Package, Clock } from 'lucide-react';

const shippingInfo = [
  { icon: Globe, text: 'South Africa, Botswana, Zimbabwe, Zambia, Namibia, Mozambique, Uganda, Kenya' },
  { icon: Truck, text: 'International: Europe, Australia, United States' },
  { icon: Package, text: 'Special packaging for live cultures' },
  { icon: Clock, text: 'Fast processing & tracking' },
];

export function ShippingBanner() {
  return (
    <section className="py-8 bg-gradient-to-r from-gut-forest via-gut-green to-gut-forest text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h3 className="font-display text-2xl font-bold mb-2">We Ship Across Africa & Worldwide</h3>
          <p className="text-white/80 text-sm">Live cultures carefully packaged for safe delivery</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shippingInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm"
            >
              <info.icon className="h-5 w-5 text-gut-lime flex-shrink-0" />
              <span className="text-sm text-white/90">{info.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { BadgeCheck, ShieldCheck, Truck } from 'lucide-react';
import './trust-badges.css';

const badges = [
  { label: 'Islandwide Delivery', Icon: Truck },
  { label: 'Secure Payments', Icon: ShieldCheck },
  { label: 'Quality Guaranteed', Icon: BadgeCheck },
];

export default function TrustBadges() {
  return (
    <section className="trust-badges" aria-label="Shopping benefits">
      {badges.map(({ label, Icon }) => (
        <div className="trust-badge" key={label}>
          <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

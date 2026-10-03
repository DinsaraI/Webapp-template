import { Link } from 'react-router-dom';
import bestSellersImage from '../images/shop_card1.jpg';
import latestReleasesImage from '../images/shop_card2.jpg';
import './hero-campaigns.css';

const campaigns = [
  {
    title: 'Best Sellers',
    badge: 'Top Rated',
    description: 'The pieces everyone keeps coming back to.',
    action: 'Shop Best Sellers',
    image: bestSellersImage,
  },
  {
    title: 'Latest Releases',
    badge: 'New Arrivals',
    description: 'Fresh silhouettes, just added to the collection.',
    action: 'Explore New Arrivals',
    image: latestReleasesImage,
  },
];

const HeroCampaigns = () => (
  <section className="hero-campaigns" aria-label="Featured collections">
    {campaigns.map((campaign) => (
      <Link
        className="hero-campaign"
        key={campaign.title}
        to="/shop"
        style={{ backgroundImage: `url(${campaign.image})` }}
      >
        <div className="hero-campaign__content">
          <span className="hero-campaign__badge">{campaign.badge}</span>
          <h2>{campaign.title}</h2>
          <p>{campaign.description}</p>
          <span className="hero-campaign__cta">{campaign.action}</span>
        </div>
      </Link>
    ))}
  </section>
);

export default HeroCampaigns;
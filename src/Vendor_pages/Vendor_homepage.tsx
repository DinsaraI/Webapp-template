import Revenue_display from './components/Revenue_display';
import Sale_items from './components/Sale_items';
import SideNavbar from './components/side_navbar';
import './Vendor_homepage.css';

const Vendor_homepage = () => {
  return (
    <div className="vendor-page-container">
      <SideNavbar activeItem="home" />
      <div className="vendor-homepage">
        <section className="vendor-header">
          <div>
            <h1>Vendor Dashboard</h1>
            <p>Live revenue and active sale items from your backend.</p>
          </div>
        </section>

        <section className="vendor-revenue-full">
          <Revenue_display />
        </section>

        <section className="vendor-widgets">
          <div className="vendor-widget items-widget">
            <Sale_items />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Vendor_homepage;

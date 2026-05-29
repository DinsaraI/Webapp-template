import SideNavbar from './components/side_navbar';
import './Orders.css';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: 'ongoing' | 'upcoming' | 'past' | 'current';
  date: string;
  items: number;
}

const Orders = () => {
  // Placeholder data - will be replaced with backend calls
  const ongoingOrders: Order[] = [];
  const upcomingOrders: Order[] = [];
  const allOrders: Order[] = [];

  return (
    <div className="vendor-page-container">
      <SideNavbar activeItem="orders" />
      <div className="orders-page">
        {/* Top Section: Ongoing and Upcoming Orders */}
        <section className="orders-header">
          <h1>Orders</h1>
          <p>Manage your orders and track shipments</p>
        </section>

        <section className="orders-split-section">
          {/* Ongoing Orders */}
          <div className="orders-column ongoing-column">
            <h2>Ongoing Orders</h2>
            <div className="orders-container">
              {ongoingOrders.length === 0 ? (
                <div className="no-orders">
                  <p>No Orders</p>
                </div>
              ) : (
                <ul className="orders-list">
                  {ongoingOrders.map((order) => (
                    <li key={order.id} className="order-item">
                      <div className="order-info">
                        <h3>{order.orderNumber}</h3>
                        <p>{order.customerName}</p>
                      </div>
                      <div className="order-meta">
                        <span className="order-total">${order.total.toFixed(2)}</span>
                        <span className="order-status">{order.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upcoming Orders */}
          <div className="orders-column upcoming-column">
            <h2>Upcoming Orders</h2>
            <div className="orders-container">
              {upcomingOrders.length === 0 ? (
                <div className="no-orders">
                  <p>No Orders</p>
                </div>
              ) : (
                <ul className="orders-list">
                  {upcomingOrders.map((order) => (
                    <li key={order.id} className="order-item">
                      <div className="order-info">
                        <h3>{order.orderNumber}</h3>
                        <p>{order.customerName}</p>
                      </div>
                      <div className="order-meta">
                        <span className="order-total">${order.total.toFixed(2)}</span>
                        <span className="order-date">{order.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Full Width: All Orders Section */}
        <section className="all-orders-section">
          <div className="all-orders-header">
            <h2>All Orders</h2>
            <div className="all-orders-filters">
              <button className="filter-btn">All</button>
              <button className="filter-btn">Current</button>
              <button className="filter-btn">Upcoming</button>
              <button className="filter-btn">Past</button>
            </div>
          </div>

          <div className="all-orders-container">
            {allOrders.length === 0 ? (
              <div className="no-orders-full">
                <p>No orders available</p>
              </div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order.id} className={`order-row ${order.status}`}>
                      <td>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{order.items}</td>
                      <td>${order.total.toFixed(2)}</td>
                      <td>{order.date}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Orders;

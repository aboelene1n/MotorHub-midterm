import Link from "../components/SmoothLink";
import HeroVideo from "../components/HeroVideo";
import { useEffect, useState } from "react";

import { Search, ShieldCheck, Headphones, BadgeCheck } from "lucide-react";
import api from "../services/api";
import VehicleCard from "../components/VehicleCard";

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles", {
        params: {
          search: search || undefined,
          listingType: listingType || undefined,
        },
      });

      setVehicles(response.data.vehicles || []);
    } catch (err) {
      setError(
        "Unable to load vehicles. Please make sure the backend and MongoDB are running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchVehicles();
  };

  return (
    <>
      <section className="hero">
        <HeroVideo />
        <div className="hero-overlay">
          <div className="container hero-content">
            <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>

            <h1>
              Find Your
              <br />
              <span>Perfect Drive.</span>
            </h1>

            <p>
              Discover premium vehicles, compare prices, and find your next car
              or rental with MotorHub.
            </p>

            <form className="search-panel" onSubmit={handleSearch}>
              <div className="search-field">
                <label>I'm looking for</label>

                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                >
                  <option value="">All vehicles</option>
                  <option value="Sale">Cars for sale</option>
                  <option value="Rent">Cars for rent</option>
                </select>
              </div>

              <div className="search-field search-keyword">
                <label>Search vehicles</label>

                <input
                  type="text"
                  placeholder="BMW, Mercedes, Toyota..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button className="btn btn-primary search-button">
                <Search size={18} />
                Search Cars
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="container benefits">
        <div>
          <ShieldCheck size={28} />
          <span>
            <strong>Secure Platform</strong>
            <small>Protected accounts</small>
          </span>
        </div>

        <div>
          <BadgeCheck size={28} />
          <span>
            <strong>Quality Listings</strong>
            <small>Detailed vehicle information</small>
          </span>
        </div>

        <div>
          <Headphones size={28} />
          <span>
            <strong>Easy Experience</strong>
            <small>Contact the seller</small>
          </span>
        </div>
      </section>

      <section className="container featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow red">EXPLORE MOTORHUB</span>
            <h2>Featured Vehicles</h2>
            <p>Discover some of the latest vehicles on our marketplace.</p>
          </div>

          <Link to="/cars" className="details-link">
            View All Vehicles →
          </Link>
        </div>

        {loading && <p className="status-message">Loading vehicles...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && vehicles.length === 0 && (
          <div className="empty-state">
            <h3>No vehicles found yet</h3>
            <p>
              New listings will appear here when sellers publish their cars.
            </p>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="vehicle-grid">
            {vehicles.slice(0, 6).map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>

      <section className="sell-banner container">
        <div>
          <span className="eyebrow">SELL WITH MOTORHUB</span>
          <h2>Ready to sell your car?</h2>
          <p>Reach potential buyers and publish your vehicle listing.</p>
        </div>

        <Link to="/sell" className="btn btn-light">
          List Your Car →
        </Link>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <Link to="/" className="brand footer-brand">
            <img src="/motorhub-logo.png" alt="MotorHub - Drive Better" />
          </Link>

          <p>Find it. Drive it. Love it.</p>

          <small>
            © {new Date().getFullYear()} MotorHub. All rights reserved.
          </small>
        </div>
      </footer>
    </>
  );
}

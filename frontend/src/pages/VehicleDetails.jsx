import Link from "../components/SmoothLink";
import { imageUrl } from "../services/images";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
export default function VehicleDetails() {
  const { id } = useParams(),
    { user } = useAuth();
  const [vehicle, setVehicle] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [photo, setPhoto] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPhoto(0);
    api
      .get("/vehicles/" + id)
      .then((r) => {
        if (active) setVehicle(r.data);
      })
      .catch((e) => {
        if (active)
          setError(e.response?.data?.message || "Unable to load vehicle.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <main className="container workspace">
        <p role="status">Loading vehicle…</p>
      </main>
    );
  if (error || !vehicle)
    return (
      <main className="container workspace">
        <div role="alert" className="notice error">
          {error}
        </div>
        <Link to="/cars">Browse vehicles</Link>
      </main>
    );
  const rent = vehicle.listingType === "Rent",
    own = user?.id === vehicle.seller?._id;
  const images = vehicle.images?.length
    ? vehicle.images
    : ["/vehicle-placeholder.svg"];
  return (
    <main className="container workspace">
      <Link className="back-link" to={rent ? "/rentals" : "/cars"}>
        ← Back to {rent ? "rentals" : "cars"}
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow red">
            {vehicle.year} · {vehicle.brand}
          </span>
          <h1>{vehicle.title}</h1>
          <p>
            {vehicle.location} · {vehicle.status}
          </p>
        </div>
      </div>
      <div className="detail-layout">
        <div>
          <img
            className="detail-photo"
            src={imageUrl(images[photo])}
            alt={vehicle.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/vehicle-placeholder.svg";
            }}
          />
          {images.length > 1 && (
            <div className="photo-strip">
              {images.map((src, i) => (
                <button
                  aria-label={"View photo " + (i + 1)}
                  aria-pressed={i === photo}
                  key={i}
                  onClick={() => setPhoto(i)}
                >
                  <img src={imageUrl(src)} alt={"Vehicle photo " + (i + 1)} />
                </button>
              ))}
            </div>
          )}
          <section className="panel">
            <h2>Built for your next journey.</h2>
            <dl className="spec-grid">
              {[
                ["Model", vehicle.model],
                ["Year", vehicle.year],
                ["Mileage", vehicle.mileage.toLocaleString() + " km"],
                ["Transmission", vehicle.transmission],
                ["Fuel", vehicle.fuelType],
                ["Condition", vehicle.condition],
                ["Body type", vehicle.bodyType || "Not specified"],
                ["Location", vehicle.location],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <h2>About this vehicle</h2>
            <p className="description">{vehicle.description}</p>
          </section>
        </div>
        <aside>
          <section className="panel price-panel">
            <span className="eyebrow">
              {rent ? "DAILY RATE" : "ASKING PRICE"}
            </span>
            <h2>
              EGP {vehicle.price.toLocaleString()}
              {rent && <small> / day</small>}
            </h2>
            <hr />
            <h3>
              {own
                ? "Your listing"
                : vehicle.seller?.name || "Owner unavailable"}
            </h3>
            {vehicle.seller?.email && (
              <a
                className="contact-link"
                href={"mailto:" + vehicle.seller.email}
              >
                {vehicle.seller.email}
              </a>
            )}
            {vehicle.seller?.phone && (
              <a className="contact-link" href={"tel:" + vehicle.seller.phone}>
                {vehicle.seller.phone}
              </a>
            )}
            {own && (
              <Link to="/my-listings" className="btn btn-secondary">
                Manage listing
              </Link>
            )}
            {rent && !own && (
              <p>Contact the owner to discuss rental availability.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

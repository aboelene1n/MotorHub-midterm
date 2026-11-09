import Link from "./SmoothLink";
import { imageUrl } from "../services/images";

import {
  Heart,
  Gauge,
  Fuel,
  Settings2,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

export default function VehicleCard({ vehicle }) {
  const image = vehicle.images?.[0] || "/vehicle-placeholder.svg";

  const isRental = vehicle.listingType === "Rent";

  const formattedPrice = Number(vehicle.price || 0).toLocaleString("en-US");

  return (
    <article className="vehicle-card">
      <div className="vehicle-image">
        <img
          src={imageUrl(image)}
          alt={`${vehicle.year || ""} ${vehicle.title || "Vehicle"}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/vehicle-placeholder.svg";
          }}
        />

        <div className="vehicle-image-shade" />

        <span className={`vehicle-type ${isRental ? "rental" : "sale"}`}>
          <span className="vehicle-type-dot" />
          {isRental ? "For Rent" : "For Sale"}
        </span>

        {vehicle.condition && (
          <span className="vehicle-condition">{vehicle.condition}</span>
        )}
      </div>

      <div className="vehicle-content">
        <div className="vehicle-heading">
          <div>
            <p className="vehicle-year">{vehicle.year || "Year unavailable"}</p>
            <h3>{vehicle.title || "Untitled Vehicle"}</h3>
          </div>

          <Link
            to={`/cars/${vehicle._id}`}
            className="vehicle-arrow"
            aria-label={`View ${vehicle.title || "vehicle"} details`}
          >
            <ArrowUpRight size={19} />
          </Link>
        </div>

        <div className="vehicle-specs">
          <span>
            <Gauge size={15} />
            {vehicle.mileage != null
              ? `${Number(vehicle.mileage).toLocaleString("en-US")} km`
              : "Mileage N/A"}
          </span>

          <span>
            <Fuel size={15} />
            {vehicle.fuelType || "Fuel N/A"}
          </span>

          <span>
            <Settings2 size={15} />
            {vehicle.transmission || "Transmission N/A"}
          </span>
        </div>

        <div className="vehicle-location">
          <MapPin size={15} />
          <span>{vehicle.location || "Location not specified"}</span>
        </div>

        <div className="vehicle-footer">
          <div className="vehicle-price">
            <small>{isRental ? "DAILY RATE" : "ASKING PRICE"}</small>
            <strong>
              <span>EGP</span> {formattedPrice}
              {isRental && <em>/ day</em>}
            </strong>
          </div>

          <Link to={`/cars/${vehicle._id}`} className="vehicle-details-btn">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

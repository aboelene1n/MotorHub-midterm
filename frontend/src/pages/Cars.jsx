import GovernorateSelect from "../components/GovernorateSelect";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import VehicleCard from "../components/VehicleCard";
export default function Cars({ listingType = "" }) {
  const location = useLocation();
  const [form, setForm] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    transmission: "",
    fuelType: "",
    location: "",
  });
  const [query, setQuery] = useState({}),
    [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    setForm({
      search: "",
      minPrice: "",
      maxPrice: "",
      transmission: "",
      fuelType: "",
      location: "",
    });
    setQuery({});
  }, [location.pathname]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .get("/vehicles", {
        params: { ...query, listingType: listingType || undefined },
        signal: controller.signal,
      })
      .then((r) => setRows(r.data.vehicles))
      .catch((e) => {
        if (e.code !== "ERR_CANCELED")
          setError(e.response?.data?.message || "Unable to load vehicles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, listingType]);
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <main className="container workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow red">THE MOTORHUB COLLECTION</span>
          <h1>
            {listingType === "Rent"
              ? "Find your next escape."
              : "Find your perfect drive."}
          </h1>
          <p>
            {listingType === "Rent"
              ? "Flexible journeys. Exceptional vehicles."
              : "Explore cars for sale, all in one place."}
          </p>
        </div>
      </div>
      <form
        className="panel filters"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(
            Object.fromEntries(
              Object.entries(form).filter(([, v]) => v !== ""),
            ),
          );
        }}
      >
        <label>
          Search
          <input
            name="search"
            value={form.search}
            onChange={change}
            placeholder="Brand, model or title"
          />
        </label>
        <label htmlFor="filter-governorate">
          Governorate
          <GovernorateSelect
            id="filter-governorate"
            value={form.location}
            onChange={change}
          />
        </label>
        <label>
          Minimum EGP
          <input
            type="number"
            min="0"
            name="minPrice"
            value={form.minPrice}
            onChange={change}
          />
        </label>
        <label>
          Maximum EGP
          <input
            type="number"
            min="0"
            name="maxPrice"
            value={form.maxPrice}
            onChange={change}
          />
        </label>
        <label>
          Transmission
          <select
            name="transmission"
            value={form.transmission}
            onChange={change}
          >
            <option value="">Any</option>
            <option>Automatic</option>
            <option>Manual</option>
          </select>
        </label>
        <label>
          Fuel
          <select name="fuelType" value={form.fuelType} onChange={change}>
            <option value="">Any</option>
            {["Petrol", "Diesel", "Electric", "Hybrid"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary">Search</button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setForm({
              search: "",
              minPrice: "",
              maxPrice: "",
              transmission: "",
              fuelType: "",
              location: "",
            });
            setQuery({});
          }}
        >
          Reset
        </button>
      </form>
      {loading ? (
        <p role="status">Finding vehicles…</p>
      ) : error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <p className="result-count">{rows.length} vehicles found</p>
          {!rows.length ? (
            <div className="empty-state">
              <h2>No matching vehicles.</h2>
              <p>Try a different search or fewer filters.</p>
            </div>
          ) : (
            <div className="vehicle-grid">
              {rows.map((v) => (
                <VehicleCard key={v._id} vehicle={v} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

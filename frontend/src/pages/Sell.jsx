import GovernorateSelect from "../components/GovernorateSelect";
import { normalizeGovernorate } from "../services/locations";
import Link from "../components/SmoothLink";
import useNavigate from "../hooks/useSmoothNavigate";
import { imageUrl } from "../services/images";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
const blank = {
  title: "",
  brand: "",
  model: "",
  year: "",
  price: "",
  mileage: 0,
  transmission: "Automatic",
  fuelType: "Petrol",
  condition: "Used",
  listingType: "Sale",
  location: "",
  bodyType: "",
  description: "",
  images: [],
  status: "Available",
};
const choices = {
  transmission: ["Automatic", "Manual"],
  fuelType: ["Petrol", "Diesel", "Electric", "Hybrid"],
  condition: ["Used", "New"],
  listingType: ["Sale", "Rent"],
  status: ["Available", "Sold", "Rented"],
};
export default function Sell() {
  const [params] = useSearchParams(),
    edit = params.get("edit"),
    navigate = useNavigate();
  const [form, setForm] = useState(blank),
    [loading, setLoading] = useState(!!edit),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setForm(blank);
    setLoading(!!edit);
    setError("");
    if (edit)
      api
        .get("/vehicles/" + edit)
        .then((r) => {
          if (active)
            setForm({
              ...blank,
              ...r.data,
              location: normalizeGovernorate(r.data.location),
            });
        })
        .catch((e) => {
          if (active)
            setError(e.response?.data?.message || "Unable to load listing.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [edit]);
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  async function upload(e) {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length + form.images.length > 8) {
      setError("Choose up to 8 images per listing.");
      return;
    }
    if (
      files.some(
        (f) =>
          !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Use PNG, JPEG or WebP images, up to 5 MB each.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const data = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        const r = await api.post("/uploads", { data });
        setForm((f) => ({ ...f, images: [...f.images, r.data.url] }));
      }
    } catch (e) {
      setError(e.response?.data?.message || "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
      };
      const { data } = edit
        ? await api.put("/vehicles/" + edit, payload)
        : await api.post("/vehicles", payload);
      navigate("/cars/" + data.vehicle._id);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save listing.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow red">SELL. RENT. CONNECT.</span>
          <h1>{edit ? "Edit your listing" : "List your vehicle"}</h1>
          <p>Clear details and great photos make a great first impression.</p>
        </div>
        <Link className="btn btn-secondary" to="/my-listings">
          My listings
        </Link>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p role="status">Loading listing…</p>
      ) : (
        <form className="panel listing-form" onSubmit={submit}>
          <h2>01 / The essentials</h2>
          <div className="form-grid">
            {[
              ["title", "Listing title"],
              ["brand", "Brand"],
              ["model", "Model"],
              ["year", "Year"],
              [
                "price",
                form.listingType === "Rent"
                  ? "Daily rate (EGP)"
                  : "Price (EGP)",
              ],
              ["mileage", "Mileage (km)"],
              ["bodyType", "Body type (optional)"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  value={form[name]}
                  onChange={change}
                  required={name !== "bodyType" && name !== "mileage"}
                  type={
                    ["year", "price", "mileage"].includes(name)
                      ? "number"
                      : "text"
                  }
                  min={name === "year" ? 1900 : 0}
                  max={
                    name === "year" ? new Date().getFullYear() + 1 : undefined
                  }
                  maxLength={200}
                />
              </label>
            ))}
            <label htmlFor="listing-governorate">
              Governorate
              <GovernorateSelect
                id="listing-governorate"
                value={form.location}
                onChange={change}
                required
              />
            </label>
            {Object.entries(choices)
              .filter(([name]) => edit || name !== "status")
              .map(([name, options]) => (
                <label key={name}>
                  {{ fuelType: "Fuel type", listingType: "Listing type" }[
                    name
                  ] || name[0].toUpperCase() + name.slice(1)}
                  <select name={name} value={form[name]} onChange={change}>
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
          <h2>02 / Tell its story</h2>
          <label>
            Description
            <textarea
              name="description"
              rows={5}
              value={form.description}
              onChange={change}
              required
              maxLength={5000}
            />
          </label>
          <h2>03 / Add photographs</h2>
          <p className="muted">
            Up to 8 PNG, JPEG or WebP photos, 5 MB each. The first image is your
            cover.
          </p>
          <label className="upload-label">
            Choose vehicle photos
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={upload}
              disabled={uploading || busy}
            />
          </label>
          {uploading && <p role="status">Uploading photographs…</p>}
          <div className="photo-strip">
            {form.images.map((url, i) => (
              <div key={url + i}>
                <img src={imageUrl(url)} alt={"Listing photo " + (i + 1)} />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      images: f.images.filter((_, j) => j !== i),
                    }))
                  }
                >
                  Remove photo {i + 1}
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" disabled={busy || uploading}>
            {busy ? "Saving…" : edit ? "Save changes" : "Publish listing"}
          </button>
        </form>
      )}
    </main>
  );
}

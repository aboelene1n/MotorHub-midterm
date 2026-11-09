import Link from "../components/SmoothLink";
import { useEffect, useState } from "react";

import api from "../services/api";
export default function MyListings() {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [deleting, setDeleting] = useState("");
  async function load() {
    setError("");
    try {
      setRows((await api.get("/vehicles/my-listings")).data);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load listings.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function remove(id) {
    setBusy(id);
    try {
      await api.delete("/vehicles/" + id);
      setDeleting("");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to delete listing.");
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="container workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow red">YOUR GARAGE</span>
          <h1>My listings</h1>
          <p>Manage the vehicles you offer for sale or rent.</p>
        </div>
        <Link className="btn btn-primary" to="/sell">
          List a vehicle
        </Link>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading listings…</p>
      ) : !rows.length ? (
        <div className="empty-state">
          <h2>Your garage is empty.</h2>
          <p>Create your first listing to get started.</p>
        </div>
      ) : (
        rows.map((v) => (
          <article className="panel booking-row" key={v._id}>
            <div>
              <span className="badge">
                {v.listingType} · {v.status}
              </span>
              <h2>
                <Link to={"/cars/" + v._id}>{v.title}</Link>
              </h2>
              <p>
                EGP {v.price.toLocaleString()}
                {v.listingType === "Rent" ? " / day" : ""} · {v.location}
              </p>
            </div>
            <div className="row-actions">
              <Link className="btn btn-secondary" to={"/sell?edit=" + v._id}>
                Edit
              </Link>
              {deleting === v._id ? (
                <>
                  <span>Delete this listing?</span>
                  <button
                    className="btn btn-primary"
                    disabled={busy === v._id}
                    onClick={() => remove(v._id)}
                  >
                    Confirm delete
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDeleting("")}
                  >
                    Keep listing
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleting(v._id)}
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </main>
  );
}

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import SmoothLink from "./components/SmoothLink";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cars from "./pages/Cars";
import Sell from "./pages/Sell";
import VehicleDetails from "./pages/VehicleDetails";
import MyListings from "./pages/MyListings";
function Protected({ children }) {
  const { user, loading } = useAuth();
  return loading ? (
    <p role="status">Loading…</p>
  ) : user ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}
function SiteLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div className="site-content">
        <Outlet />
      </div>
    </>
  );
}
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SiteLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cars" element={<Cars listingType="Sale" />} />
      <Route path="/rentals" element={<Cars listingType="Rent" />} />
      <Route path="/cars/:id" element={<VehicleDetails />} />
      <Route
        path="/sell"
        element={
          <Protected>
            <Sell />
          </Protected>
        }
      />
      <Route
        path="/my-listings"
        element={
          <Protected>
            <MyListings />
          </Protected>
        }
      />
      <Route
        path="/dashboard"
        element={<Navigate to="/my-listings" replace />}
      />
      <Route
        path="*"
        element={
          <main className="container workspace">
            <h1>Page not found</h1>
            <SmoothLink to="/">Return home</SmoothLink>
          </main>
        }
      />
    </Route>,
  ),
);
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

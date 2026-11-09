import Link from "./SmoothLink";
import useNavigate from "../hooks/useSmoothNavigate";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Heart, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/motorhub-logo.png" alt="MotorHub - Drive Better" />
        </Link>

        <nav className="nav-links">
          <Link to="/" className={isActive("/")}>
            Home
          </Link>
          <Link to="/cars" className={isActive("/cars")}>
            Buy a Car
          </Link>
          <Link to="/rentals" className={isActive("/rentals")}>
            Rent a Car
          </Link>
          <Link to="/sell" className={isActive("/sell")}>
            List a Vehicle
          </Link>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-user">
                <User size={17} />
                <span>{user.name}</span>
              </Link>

              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="signup-btn">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

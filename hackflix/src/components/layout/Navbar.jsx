import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, User, Menu, X } from "lucide-react";
import { clsx } from "clsx";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide navbar on login page if desired, or keep it. user requirement says "Login Page: A high-end landing page".
  // Usually login pages don't have the main app navbar.
  if (location.pathname === "/") return null;

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        isScrolled
          ? "bg-[#141414]"
          : "bg-gradient-to-b from-black/80 to-transparent",
      )}
    >
      <div className="mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
        {/* Left Side: Logo & Links */}
        <div className="flex items-center space-x-8">
          <Link
            to="/browse"
            className="text-[#E50914] text-2xl font-bold tracking-tighter"
          >
            HACKFLIX
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
            <Link to="/browse" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/browse" className="hover:text-white transition-colors">
              TV Shows
            </Link>
            <Link to="/browse" className="hover:text-white transition-colors">
              Movies
            </Link>
            <Link to="/browse" className="hover:text-white transition-colors">
              New & Popular
            </Link>
            <Link to="/browse" className="hover:text-white transition-colors">
              My List
            </Link>
          </div>
        </div>

        {/* Right Side: Icons */}
        <div className="hidden md:flex items-center space-x-6 text-white">
          <button className="hover:text-gray-300">
            <Search className="w-5 h-5" />
          </button>
          <button className="hover:text-gray-300">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 cursor-pointer group">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white transition-transform group-hover:rotate-180" />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#141414] absolute top-full left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex flex-col space-y-4 text-gray-300">
            <Link to="/browse" className="hover:text-white">
              Home
            </Link>
            <Link to="/browse" className="hover:text-white">
              TV Shows
            </Link>
            <Link to="/browse" className="hover:text-white">
              Movies
            </Link>
            <Link to="/browse" className="hover:text-white">
              New & Popular
            </Link>
            <Link to="/browse" className="hover:text-white">
              My List
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

import { Link } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileBottomNav from "./MobileBottomNav";

const Navbar = () => {
  const { auth } = usePuterStore();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Desktop Header */}
      <header className="site-header">
        <nav className={`navbar ${isScrolled ? "navbar--scrolled" : ""}`}>
          <Link to="/">
            <p className="text-2xl font-bold text-gradient">ARBA</p>
          </Link>
          <div className="navbar-actions">
            <LanguageSwitcher />
            {auth.isAuthenticated && (
              <button
                className="primary-button w-fit navbar-logout"
                onClick={auth.signOut}
              >
                <span className="navbar-logout__label">
                  {t("common.logOut")}
                </span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Logo (non-fixed) */}
      <div className="mobile-logo-header">
        <Link to="/">
          <p className="text-2xl font-bold text-gradient">ARBA</p>
        </Link>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
};

export default Navbar;
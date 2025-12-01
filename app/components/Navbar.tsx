import { Link } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

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
    <header className="site-header">
      <nav className={`navbar ${isScrolled ? "navbar--scrolled" : ""}`}>
        <Link to="/">
          <p className="text-2xl font-bold text-gradient">ARBA</p>
        </Link>
        <div className="navbar-actions">
          <LanguageSwitcher />
          {auth.isAuthenticated && (
            <button
              className="primary-button w-fit"
              onClick={auth.signOut}
            >
              {t("common.logOut")}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
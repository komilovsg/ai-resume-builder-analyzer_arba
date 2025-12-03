import { Link } from "react-router";
import { useEffect, useState, useRef } from "react";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileBottomNav from "./MobileBottomNav";

const Navbar = () => {
  const { auth } = usePuterStore();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);


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
              <div className="navbar-user-section" ref={profileRef}>
                {auth.user && (
                  <>
                    <button
                      type="button"
                      className="navbar-user-info"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      aria-label="User menu"
                    >
                      <div className="navbar-user-avatar">
                        <span className="navbar-user-avatar-text">
                          {auth.user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <svg
                        className={`navbar-user-chevron ${isProfileOpen ? 'navbar-user-chevron--open' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {isProfileOpen && (
                      <div className="navbar-user-dropdown">
                        <div className="navbar-user-dropdown__header">
                          <div className="navbar-user-dropdown__avatar">
                            <span className="navbar-user-dropdown__avatar-text">
                              {auth.user.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="navbar-user-dropdown__info">
                            <p className="navbar-user-dropdown__name">{auth.user.username || 'User'}</p>
                            {auth.user.email && (
                              <p className="navbar-user-dropdown__email">{auth.user.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="navbar-user-dropdown__divider"></div>
                        <button
                          type="button"
                          className="navbar-user-dropdown__logout"
                          onClick={() => {
                            auth.signOut();
                            setIsProfileOpen(false);
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{t("common.logOut")}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
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
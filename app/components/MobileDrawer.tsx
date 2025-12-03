import { useEffect } from 'react';
import Icon from './Icon';
import MobileLanguageSwitcher from './MobileLanguageSwitcher';
import { useTranslation } from 'react-i18next';
import type { PuterUser } from '~/types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'logout' | 'language';
  onLogout?: () => void;
  user?: PuterUser | null;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  type,
  onLogout,
  user,
}: MobileDrawerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="mobile-drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className={`mobile-drawer mobile-drawer--${type}`}>
        <div className="mobile-drawer__header">
          <h3 className="mobile-drawer__title">
            {type === 'logout' ? t('mobile.menu') : t('mobile.language')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="mobile-drawer__close"
            aria-label={t('common.close')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mobile-drawer__content">
          {type === 'logout' && (
            <>
              {user && (
                <div className="mobile-drawer__user-info">
                  <div className="mobile-drawer__user-avatar">
                    <span className="mobile-drawer__user-avatar-text">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="mobile-drawer__user-details">
                    <p className="mobile-drawer__user-name">{user.username || 'User'}</p>
                    {user.email && (
                      <p className="mobile-drawer__user-email">{user.email}</p>
                    )}
                  </div>
                </div>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="mobile-drawer__logout-button"
                >
                  <Icon name="logout" size={24} />
                  <span>{t('common.logOut')}</span>
                </button>
              )}
            </>
          )}

          {type === 'language' && <MobileLanguageSwitcher onClose={onClose} />}
        </div>
      </div>
    </>
  );
}


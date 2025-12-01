import { useState } from 'react';
import Icon from './Icon';
import MobileDrawer from './MobileDrawer';
import { usePuterStore } from '~/lib/puter';

export default function MobileBottomNav() {
  const { auth } = usePuterStore();
  const [drawerType, setDrawerType] = useState<'logout' | 'language' | null>(
    null
  );

  if (!auth.isAuthenticated) return null;

  const openDrawer = (type: 'logout' | 'language') => {
    setDrawerType(type);
  };

  const closeDrawer = () => {
    setDrawerType(null);
  };

  return (
    <>
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          onClick={() => openDrawer('language')}
          className="mobile-bottom-nav__button"
          aria-label="Change language"
        >
          <Icon name="language" size={24} />
        </button>
        <button
          type="button"
          onClick={() => openDrawer('logout')}
          className="mobile-bottom-nav__button"
          aria-label="Logout"
        >
          <Icon name="logout" size={24} />
        </button>
      </nav>

      <MobileDrawer
        isOpen={drawerType !== null}
        onClose={closeDrawer}
        type={drawerType || 'logout'}
        onLogout={auth.signOut}
      />
    </>
  );
}


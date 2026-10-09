import { useAuth } from 'react-oidc-context';
import { LogOut, Award, MapPin, CheckCircle, Settings, ChevronRight } from 'lucide-react';
import './ProfileView.css';

const ProfileView = () => {
  const auth = useAuth();
  const user = auth.user?.profile;
  
  // Extract user info or use defaults if not fully populated
  const email = user?.email || 'user@example.com';
  const name = user?.name || user?.preferred_username || email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = () => {
    // Attempt Cognito sign out, fallback to clearing local state
    if (auth.signoutRedirect) {
      auth.signoutRedirect();
    } else {
      auth.removeUser();
      window.location.reload();
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h2>My Profile</h2>
      </header>

      <div className="profile-content">
        {/* User Info Card */}
        <div className="profile-card user-card">
          <div className="avatar-large">{initial}</div>
          <h3 className="user-name">{name}</h3>
          <p className="user-email">{email}</p>
        </div>



        {/* Menu Options */}
        <h3 className="section-subtitle">Settings</h3>
        <div className="menu-list">
          <button className="menu-item">
            <div className="menu-item-left">
              <div className="menu-icon-bg">
                <Settings size={20} color="#475569" />
              </div>
              <span>Account Settings</span>
            </div>
            <ChevronRight size={20} color="#94A3B8" />
          </button>
          
          <button className="menu-item text-danger" onClick={handleSignOut}>
            <div className="menu-item-left">
              <div className="menu-icon-bg danger">
                <LogOut size={20} color="#EF4444" />
              </div>
              <span>Sign Out</span>
            </div>
            <ChevronRight size={20} color="#94A3B8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

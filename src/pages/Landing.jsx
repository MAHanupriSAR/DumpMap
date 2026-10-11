import { ShieldCheck, User, ArrowRight } from 'lucide-react';
import { citizenUserManager, workerUserManager } from '../authConfig';
import './Landing.css';

const Landing = () => {
  const handleCitizenLogin = () => {
    localStorage.setItem('auth_pool', 'citizen');
    localStorage.setItem('userRole', 'citizen');
    citizenUserManager.signinRedirect();
  };

  const handleStaffLogin = () => {
    localStorage.setItem('auth_pool', 'worker');
    localStorage.setItem('userRole', 'staff');
    workerUserManager.signinRedirect();
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <img src="/logo.png" alt="DumpMap Logo" className="landing-logo" />
          <h1>DumpMap</h1>
          <p>The intelligent municipal waste tracking platform.</p>
        </div>

        <div className="landing-options">
          <button className="landing-card" onClick={handleCitizenLogin}>
            <div className="card-icon">
              <User size={32} color="#3B82F6" />
            </div>
            <div className="card-text">
              <h3>Continue as Citizen</h3>
              <p>Report waste, track cleanups, and keep your neighborhood clean.</p>
            </div>
            <ArrowRight size={20} color="#94A3B8" />
          </button>

          <button className="landing-card" onClick={handleStaffLogin}>
            <div className="card-icon" style={{ backgroundColor: '#F0FDF4' }}>
              <ShieldCheck size={32} color="#16A34A" />
            </div>
            <div className="card-text">
              <h3>Municipal Staff</h3>
              <p>Sign in to manage tasks and resolve reports in your zone.</p>
            </div>
            <ArrowRight size={20} color="#94A3B8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;

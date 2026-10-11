import { UserManager } from 'oidc-client-ts';

// ── CITIZEN USER POOL (Allows self-registration for public users) ───────────
export const citizenAuthConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_igoGrvGIP",
  client_id: "55dht6jg5ta3c3heobhneh5na8",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone profile",
};

// ── WORKER USER POOL (Self-registration disabled, NO signup button) ─────────
export const workerAuthConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_e362DPLy7",
  client_id: "40k8du3o5djge7mbasnftrcm7m",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone profile",
};

export const citizenUserManager = new UserManager(citizenAuthConfig);
export const workerUserManager = new UserManager(workerAuthConfig);

export const getActiveAuthConfig = () => {
  const pool = localStorage.getItem('auth_pool');
  return pool === 'worker' ? workerAuthConfig : citizenAuthConfig;
};

// ── COGNITO SIGNOUT HANDLER ────────────────────────────────────────────────
// AWS Cognito requires /logout?client_id=...&logout_uri=... and rejects standard
// OIDC id_token_hint query parameters with an HTTP 400 error.
export const signOutCognito = (auth) => {
  const pool = localStorage.getItem('auth_pool');
  
  // Clear local session
  localStorage.removeItem('auth_pool');
  localStorage.removeItem('userRole');
  localStorage.removeItem('staffLoggedIn');
  localStorage.removeItem('workerId');
  localStorage.removeItem('workerName');
  localStorage.removeItem('workerZone');

  if (auth && auth.removeUser) {
    auth.removeUser();
  }

  const clientId = pool === 'worker' ? workerAuthConfig.client_id : citizenAuthConfig.client_id;
  const domain = pool === 'worker'
    ? 'https://dumpmap-staff.auth.ap-south-1.amazoncognito.com'
    : 'https://ap-south-1igogrvgip.auth.ap-south-1.amazoncognito.com';

  const logoutUri = encodeURIComponent(window.location.origin);
  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
};

import { UserManager } from 'oidc-client-ts';

// ── CITIZEN USER POOL (Allows self-registration for public users) ───────────
export const citizenAuthConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_igoGrvGIP",
  client_id: "55dht6jg5ta3c3heobhneh5na8",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone",
};

// ── WORKER USER POOL (Self-registration disabled, NO signup button) ─────────
export const workerAuthConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_e362DPLy7",
  client_id: "40k8du3o5djge7mbasnftrcm7m",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone",
};

export const citizenUserManager = new UserManager(citizenAuthConfig);
export const workerUserManager = new UserManager(workerAuthConfig);

export const getActiveAuthConfig = () => {
  const pool = localStorage.getItem('auth_pool');
  return pool === 'worker' ? workerAuthConfig : citizenAuthConfig;
};

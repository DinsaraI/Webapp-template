// authService.ts
// ------------------------------------------------------------------
// Friendly note for backend devs:
// Hi backend team! I left a tiny Easter egg here 😊
// Feel free to wire these methods to your real authentication API.
// ------------------------------------------------------------------

const STORAGE_KEY = 'a2w-vendor-auth';

export interface AuthPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  businessName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  token?: string;
  message?: string;
}

function persistAuth(user: { id: string; name: string; email?: string }) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ isSignedIn: true, user }));
}

function loadAuthState(): { isSignedIn: boolean; user?: { name: string } } {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return { isSignedIn: false };

  try {
    return JSON.parse(raw);
  } catch {
    return { isSignedIn: false };
  }
}

export async function login(payload: AuthPayload): Promise<AuthResult> {
  console.log('[authService] login called', payload);

  if (payload.username === 'AuthD' && payload.password === 'Dinsara') {
    const user = { id: 'vendor-AuthD', name: 'AuthD Vendor', email: 'authd@a2w.vendor' };
    persistAuth(user);
    return {
      success: true,
      user,
      token: 'VENDOR-AUTHD-TOKEN',
    };
  }

  const current = loadAuthState();
  if (current.isSignedIn && current.user?.name === payload.username) {
    return {
      success: true,
      user: { id: `vendor-${payload.username}`, name: payload.username },
      token: 'VENDOR-SESSION-TOKEN',
    };
  }

  return { success: false, message: 'Invalid credentials' };
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  console.log('[authService] register called', payload);

  if (!payload.username.trim()) {
    return { success: false, message: 'Please enter a username.' };
  }

  if (!payload.password.trim()) {
    return { success: false, message: 'Please enter a password.' };
  }

  const user = {
    id: `vendor-${payload.username.toLowerCase().replace(/\s+/g, '-')}`,
    name: payload.username,
    email: `${payload.username.toLowerCase().replace(/\s+/g, '.')}@vendor.a2w`,
  };

  persistAuth(user);

  return {
    success: true,
    user,
    token: 'VENDOR-REGISTER-TOKEN',
  };
}

export async function logout(): Promise<void> {
  console.log('[authService] logout called');
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function fetchAuthState(): Promise<{ isSignedIn: boolean; user?: { name: string } }> {
  console.log('[authService] fetchAuthState called');
  return loadAuthState();
}

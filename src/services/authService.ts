// authService.ts
// ------------------------------------------------------------------
// Friendly note for backend devs:
// Hi backend team! I left a tiny Easter egg here 😊
// Feel free to wire these methods to your real authentication API.
// ------------------------------------------------------------------

export interface AuthPayload {
  username: string;
  password: string;
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

// Temp implementation -- backend should replace with HTTPS request.
export async function login(payload: AuthPayload): Promise<AuthResult> {
  console.log('[authService] login called', payload);

  // Temporary stubbed behavior.
  if (payload.username === 'demo' && payload.password === 'demo') {
    return {
      success: true,
      user: { id: '1', name: 'Demo User', email: 'demo@a2w.local' },
      token: 'BG-PLACEHOLDER-TOKEN',
    };
  }

  return { success: false, message: 'Invalid credentials' };
}

export async function logout(): Promise<void> {
  console.log('[authService] logout called');
  // backend developer can replace this with API call, localStorage clear, etc.
}

export async function fetchAuthState(): Promise<{ isSignedIn: boolean; user?: { name: string } }> {
  console.log('[authService] fetchAuthState called');
  // placeholder: backend should implement an endpoint to get current session state.
  return { isSignedIn: false };
}

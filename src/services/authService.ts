import { supabase } from '../supabaseClient';

const appRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim()
  || 'https://dinsarai.github.io/Webapp-template/';

export function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function register(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: appRedirectUrl,
    },
  });
}

export function logout() {
  return supabase.auth.signOut();
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: appRedirectUrl },
  });
}

export function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appRedirectUrl,
  });
}

export function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role === 'admin';
}

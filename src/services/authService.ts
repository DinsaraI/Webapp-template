import { supabase } from '../supabaseClient';

export function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function register(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export function logout() {
  return supabase.auth.signOut();
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
}

export function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
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

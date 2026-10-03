import { supabase } from '../supabaseClient';
import type { ShippingAddress, ShippingAddressInput, UserProfile } from '../types/profile';

export async function getSignedInUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Sign in to manage your profile.');
  return user;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getSignedInUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, phone_number, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function saveUserProfile(input: Pick<UserProfile, 'full_name' | 'username' | 'phone_number'>): Promise<void> {
  const user = await getSignedInUser();
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (readError) throw readError;

  const result = existing
    ? await supabase.from('profiles').update(input).eq('id', user.id)
    : await supabase.from('profiles').insert({ id: user.id, ...input });

  if (result.error) throw result.error;
}

export async function listShippingAddresses(): Promise<ShippingAddress[]> {
  const user = await getSignedInUser();
  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShippingAddress[];
}

export async function saveShippingAddress(
  input: ShippingAddressInput,
  addressId?: string,
): Promise<ShippingAddress> {
  const user = await getSignedInUser();

  if (addressId) {
    const { data: ownedAddress, error: ownershipError } = await supabase
      .from('shipping_addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ownershipError) throw ownershipError;
    if (!ownedAddress) throw new Error('That shipping address is not available on your account.');
  }

  if (input.is_default) {
    let clearDefaults = supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
    if (addressId) clearDefaults = clearDefaults.neq('id', addressId);
    const { error } = await clearDefaults;
    if (error) throw error;
  }

  const result = addressId
    ? await supabase
      .from('shipping_addresses')
      .update(input)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select('*')
      .single()
    : await supabase
      .from('shipping_addresses')
      .insert({ ...input, user_id: user.id })
      .select('*')
      .single();

  if (result.error) throw result.error;
  return result.data as ShippingAddress;
}

export async function setDefaultShippingAddress(addressId: string): Promise<void> {
  const user = await getSignedInUser();
  const { data: ownedAddress, error: ownershipError } = await supabase
    .from('shipping_addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (ownershipError) throw ownershipError;
  if (!ownedAddress) throw new Error('That shipping address is not available on your account.');

  const { error: clearError } = await supabase
    .from('shipping_addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_default', true)
    .neq('id', addressId);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from('shipping_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function deleteShippingAddress(addressId: string): Promise<void> {
  const user = await getSignedInUser();
  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);

  if (error) throw error;
}

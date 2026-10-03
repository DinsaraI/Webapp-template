export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  phone_number: string;
  created_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type ShippingAddressInput = Omit<ShippingAddress, 'id' | 'user_id' | 'created_at'>;

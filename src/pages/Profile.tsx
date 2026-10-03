import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LoaderCircle, MapPin, Plus, Save, Star, Trash2, X } from 'lucide-react';
import Navbar from '../assets/components/navbar';
import Footer from '../assets/components/footer';
import { supabase } from '../supabaseClient';
import {
  deleteShippingAddress,
  getUserProfile,
  listShippingAddresses,
  saveShippingAddress,
  saveUserProfile,
  setDefaultShippingAddress,
} from '../services/profileService';
import type { ShippingAddress, ShippingAddressInput } from '../types/profile';
import './Profile.css';

interface ProfileProps {
  isSignedIn: boolean;
  onSignOut: () => void;
}

const Profile = ({ isSignedIn, onSignOut }: ProfileProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressActionId, setAddressActionId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<ShippingAddressInput>({
    recipient_name: '',
    phone_number: '',
    street_address: '',
    city: '',
    postal_code: '',
    country: 'Sri Lanka',
    is_default: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [addressError, setAddressError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError?.name === 'AuthSessionMissingError') {
          navigate('/login', { replace: true });
          return;
        }
        if (userError) throw userError;
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        const [profile, savedAddresses] = await Promise.all([
          getUserProfile(),
          listShippingAddresses(),
        ]);
        if (!active) return;

        setFullName(profile?.full_name ?? user.user_metadata.full_name ?? '');
        setUsername(profile?.username ?? '');
        setPhoneNumber(profile?.phone_number ?? '');
        setEmail(user.email ?? '');
        setAddresses(savedAddresses);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = fullName.trim();
    const cleanUsername = username.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName) {
      setErrorMessage('Enter your name before saving.');
      setSuccessMessage('');
      return;
    }
    if (cleanUsername && !/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
      setErrorMessage('Username must be 3 to 30 characters and use only letters, numbers, dots, underscores, or hyphens.');
      setSuccessMessage('');
      return;
    }

    setSavingProfile(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await saveUserProfile({ full_name: cleanName, username: cleanUsername, phone_number: cleanPhone });
      setFullName(cleanName);
      setUsername(cleanUsername);
      setPhoneNumber(cleanPhone);
      setSuccessMessage('Profile saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile could not be saved.';
      setErrorMessage(message.includes('profiles_username_lower_key') ? 'That username is already in use.' : message);
    } finally {
      setSavingProfile(false);
    }
  };

  const startNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      recipient_name: fullName,
      phone_number: phoneNumber,
      street_address: '',
      city: '',
      postal_code: '',
      country: 'Sri Lanka',
      is_default: addresses.length === 0,
    });
    setAddressFormOpen(true);
    setAddressError('');
    setSuccessMessage('');
  };

  const startEditAddress = (address: ShippingAddress) => {
    const { recipient_name, phone_number, street_address, city, postal_code, country, is_default } = address;
    setEditingAddressId(address.id);
    setAddressForm({ recipient_name, phone_number, street_address, city, postal_code, country, is_default });
    setAddressFormOpen(true);
    setAddressError('');
    setSuccessMessage('');
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    setAddressError('');
    setSuccessMessage('');
    try {
      await saveShippingAddress({
        ...addressForm,
        recipient_name: addressForm.recipient_name.trim(),
        phone_number: addressForm.phone_number.trim(),
        street_address: addressForm.street_address.trim(),
        city: addressForm.city.trim(),
        postal_code: addressForm.postal_code.trim(),
        country: addressForm.country.trim(),
      }, editingAddressId ?? undefined);
      setAddresses(await listShippingAddresses());
      setAddressFormOpen(false);
      setSuccessMessage('Shipping address saved.');
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Shipping address could not be saved.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setAddressActionId(addressId);
    setAddressError('');
    setSuccessMessage('');
    try {
      await setDefaultShippingAddress(addressId);
      setAddresses(await listShippingAddresses());
      setSuccessMessage('Default shipping address updated.');
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Default address could not be updated.');
    } finally {
      setAddressActionId(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this shipping address?')) return;
    setAddressActionId(addressId);
    setAddressError('');
    setSuccessMessage('');
    try {
      await deleteShippingAddress(addressId);
      setAddresses(await listShippingAddresses());
      setSuccessMessage('Shipping address deleted.');
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Shipping address could not be deleted.');
    } finally {
      setAddressActionId(null);
    }
  };

  return (
    <div className="profile-page">
      <Navbar isSignedIn={isSignedIn} onSignOut={onSignOut} />
      <main className="profile-main">
        <header className="profile-heading">
          <p>ACCOUNT</p>
          <h1>Profile</h1>
        </header>

        {loading ? (
          <p className="profile-message profile-loading" role="status"><LoaderCircle className="profile-spinner" size={18} aria-hidden="true" /> Loading profile and saved addresses...</p>
        ) : (
          <div className="profile-layout">
            <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
              <h2>Account details</h2>
              <label>
                Full name
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setSuccessMessage('');
                  }}
                  required
                />
              </label>
              <label>
                Username
                <input
                  type="text"
                  autoComplete="username"
                  maxLength={30}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setSuccessMessage('');
                  }}
                  minLength={username ? 3 : undefined}
                  pattern="[A-Za-z0-9_.-]{3,30}"
                  placeholder="Choose a username"
                />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={32}
                  value={phoneNumber}
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    setSuccessMessage('');
                  }}
                />
              </label>
              <label>
                Email
                <input type="email" value={email} readOnly />
              </label>

              {errorMessage && <p className="profile-message error" role="alert">{errorMessage}</p>}
              {successMessage && <p className="profile-message success" role="status">{successMessage}</p>}

              <button className="profile-save" type="submit" disabled={savingProfile}>
                {savingProfile ? <LoaderCircle className="profile-spinner" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <section className="profile-addresses" aria-labelledby="profile-address-title">
              <header className="profile-addresses-heading">
                <div>
                  <p>DELIVERY</p>
                  <h2 id="profile-address-title">Saved shipping addresses</h2>
                </div>
                {!addressFormOpen && (
                  <button className="profile-add-address" type="button" onClick={startNewAddress}>
                    <Plus size={17} aria-hidden="true" /> Add address
                  </button>
                )}
              </header>

              {addresses.length === 0 && !addressFormOpen && (
                <p className="profile-address-empty">No saved addresses yet.</p>
              )}

              <div className="profile-address-list">
                {addresses.map((address) => (
                  <article className="profile-address" key={address.id}>
                    <div className="profile-address-icon"><MapPin size={18} aria-hidden="true" /></div>
                    <div className="profile-address-details">
                      <div className="profile-address-title">
                        <h3>{address.recipient_name}</h3>
                        {address.is_default && <span className="profile-default-badge"><Star size={12} fill="currentColor" /> Default</span>}
                      </div>
                      <p>{address.phone_number}</p>
                      <p>{address.street_address}, {address.city} {address.postal_code}</p>
                      <p>{address.country}</p>
                    </div>
                    <div className="profile-address-actions">
                      {!address.is_default && (
                        <button type="button" onClick={() => void handleSetDefault(address.id)} disabled={addressActionId !== null} aria-label={`Set ${address.recipient_name}'s address as default`} title="Set as default">
                          {addressActionId === address.id ? <LoaderCircle className="profile-spinner" size={16} aria-hidden="true" /> : <Star size={16} aria-hidden="true" />}
                        </button>
                      )}
                      <button type="button" onClick={() => startEditAddress(address)} disabled={addressActionId !== null} aria-label={`Edit address for ${address.recipient_name}`} title="Edit address">Edit</button>
                      <button type="button" onClick={() => void handleDeleteAddress(address.id)} disabled={addressActionId !== null} aria-label={`Delete address for ${address.recipient_name}`} title="Delete address">
                        {addressActionId === address.id ? <LoaderCircle className="profile-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {addressFormOpen && (
                <form className="profile-form profile-address-form" onSubmit={(event) => void handleAddressSubmit(event)}>
                  <div className="profile-address-form-heading">
                    <h3>{editingAddressId ? 'Edit address' : 'New shipping address'}</h3>
                    <button type="button" onClick={() => setAddressFormOpen(false)} aria-label="Cancel address editing"><X size={18} /></button>
                  </div>
                  <label>
                    Recipient name
                    <input type="text" autoComplete="name" maxLength={100} value={addressForm.recipient_name} onChange={(event) => setAddressForm((current) => ({ ...current, recipient_name: event.target.value }))} required />
                  </label>
                  <label>
                    Phone number
                    <input type="tel" autoComplete="tel" maxLength={32} value={addressForm.phone_number} onChange={(event) => setAddressForm((current) => ({ ...current, phone_number: event.target.value }))} required />
                  </label>
                  <label>
                    Street address
                    <input type="text" autoComplete="street-address" maxLength={200} value={addressForm.street_address} onChange={(event) => setAddressForm((current) => ({ ...current, street_address: event.target.value }))} required />
                  </label>
                  <div className="profile-form-row">
                    <label>
                      City
                      <input type="text" autoComplete="address-level2" maxLength={100} value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} required />
                    </label>
                    <label>
                      Postal code
                      <input type="text" autoComplete="postal-code" maxLength={20} value={addressForm.postal_code} onChange={(event) => setAddressForm((current) => ({ ...current, postal_code: event.target.value }))} required />
                    </label>
                  </div>
                  <label>
                    Country
                    <input type="text" autoComplete="country-name" maxLength={100} value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))} required />
                  </label>
                  <label className="profile-default-toggle">
                    <input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))} />
                    <span>Make this my default shipping address</span>
                  </label>
                  {addressError && <p className="profile-message error" role="alert">{addressError}</p>}
                  <div className="profile-address-form-actions">
                    <button className="profile-save" type="submit" disabled={savingAddress}>
                      {savingAddress ? <LoaderCircle className="profile-spinner" size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
                      {savingAddress ? 'Saving...' : 'Save address'}
                    </button>
                    <button className="profile-cancel" type="button" onClick={() => setAddressFormOpen(false)} disabled={savingAddress}>Cancel</button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

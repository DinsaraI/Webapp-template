import { useState } from 'react';
import { Upload, Save, X } from 'lucide-react';
import SideNavbar from './components/side_navbar';
import './Vendor_profile.css';

interface VendorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  description: string;
  profileIcon?: string;
  phone?: string;
  address?: string;
  joinDate: string;
}

const Vendor_profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<VendorProfile>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    description: 'A passionate vendor dedicated to providing quality products.',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    joinDate: '2023-01-15',
  });

  const [editForm, setEditForm] = useState(profile);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProfileImage(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate backend call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfile(editForm);
      setIsEditing(false);
      // TODO: Replace with actual backend API call
      console.log('Profile saved:', editForm);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setImagePreview(null);
    setProfileImage(null);
    setIsEditing(false);
  };

  return (
    <div className="vendor-page-container">
      <SideNavbar activeItem="profile" />
      <div className="profile-page">
        {/* Header */}
        <section className="profile-header">
          <h1>Vendor Profile</h1>
          <p>Manage your profile information</p>
        </section>

        {/* Profile Container */}
        <section className="profile-container">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture">
              {imagePreview || profile.profileIcon ? (
                <img src={imagePreview || profile.profileIcon} alt="Profile" />
              ) : (
                <div className="placeholder-avatar">
                  <span>{profile.firstName[0]}{profile.lastName[0]}</span>
                </div>
              )}
            </div>
            {isEditing && (
              <label className="upload-button">
                <Upload size={18} />
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Profile Information */}
          <div className="profile-info-section">
            {!isEditing ? (
              <>
                {/* View Mode */}
                <div className="profile-view">
                  <div className="info-group">
                    <h2>
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="email">{profile.email}</p>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <label>Phone</label>
                      <p>{profile.phone || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Member Since</label>
                      <p>{new Date(profile.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <p>{profile.address || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="info-item full-width">
                    <label>Description</label>
                    <p className="description">{profile.description}</p>
                  </div>

                  <button className="edit-button" onClick={() => {
                    setEditForm(profile);
                    setIsEditing(true);
                  }}>
                    Edit Profile
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <div className="profile-edit">
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editForm.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editForm.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        placeholder="Enter email"
                        disabled
                      />
                      <small>Email cannot be changed</small>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={editForm.phone || ''}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={editForm.address || ''}
                          onChange={handleInputChange}
                          placeholder="Enter address"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={editForm.description}
                        onChange={handleInputChange}
                        placeholder="Write your vendor description..."
                        rows={5}
                      />
                      <small>{editForm.description.length}/500 characters</small>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="save-button"
                        disabled={isSaving}
                      >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Vendor_profile;

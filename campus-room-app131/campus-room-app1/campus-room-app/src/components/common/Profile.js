import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/profile-styles.css';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    // Reset form data when toggling edit mode
    if (!isEditing) {
      setFormData({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        email: currentUser?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setMessage('');
      setError('');
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    // Validate form
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return setError('New passwords do not match');
    }
    
    // In a real app, you would verify the current password
    // For this demo, we'll just update the profile
    
    try {
      // Update user profile (this is a mock implementation)
      const result = updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      console.error(err);
    }
  };
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>User Profile</h2>
          <button 
            className={`btn-${isEditing ? 'secondary' : 'primary'}`}
            onClick={toggleEdit}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        {message && <div className="success-alert">{message}</div>}
        {error && <div className="error-alert">{error}</div>}
        
        <div className="profile-container">
          {!isEditing ? (
            <div className="profile-info">
              <div className="profile-header">
                <div className="profile-avatar">
                  {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                </div>
                <div className="profile-name">
                  <h3>{currentUser?.firstName} {currentUser?.lastName}</h3>
                  <div className="role-badge">{currentUser?.role}</div>
                </div>
              </div>
              
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{currentUser?.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">First Name</span>
                  <span className="profile-value">{currentUser?.firstName}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Last Name</span>
                  <span className="profile-value">{currentUser?.lastName}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Role</span>
                  <span className="profile-value">{currentUser?.role}</span>
                </div>
              </div>
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                />
                <small>Email address cannot be changed</small>
              </div>
              
              <h3 className="form-section-title">Change Password</h3>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input 
                  type="password" 
                  id="currentPassword" 
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
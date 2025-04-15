import React, { useState, useEffect } from 'react';
import API from '../../api';
import '../../styles/dashboard.css';

const UserManagement = () => {
  // States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    status: 'active'
  });
  const [actionInProgress, setActionInProgress] = useState(false);

  // Format and normalize user data to handle null values
  const formatUserData = (user) => {
    return {
      ...user,
      // Ensure these values have defaults if they're null or undefined
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'inactive', // Default to inactive if status is null
      lastLoginDisplay: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    };
  };

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...');
      const response = await API.get('/users');
      console.log('Users response:', response.data);
      
      // Format and normalize user data
      const formattedUsers = response.data.map(formatUserData);
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please check your connection and try again.');
      setLoading(false);
    }
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // If a role filter is selected, use the API endpoint
      if (filterCriteria.role && !filterCriteria.status && !filterCriteria.search) {
        const response = await API.get(`/users/role/${filterCriteria.role}`);
        const formattedUsers = response.data.map(formatUserData);
        setFilteredUsers(formattedUsers);
      } 
      // If a status filter is selected and no role, use status endpoint
      else if (filterCriteria.status && !filterCriteria.role && !filterCriteria.search) {
        const response = await API.get(`/users/status/${filterCriteria.status}`);
        const formattedUsers = response.data.map(formatUserData);
        setFilteredUsers(formattedUsers);
      }
      // Otherwise, filter client-side for more complex filters or search
      else {
        let filtered = [...users];
        
        if (filterCriteria.role) {
          filtered = filtered.filter(user => 
            (user.role || '').toLowerCase() === filterCriteria.role.toLowerCase()
          );
        }
        
        if (filterCriteria.status) {
          filtered = filtered.filter(user => 
            (user.status || '').toLowerCase() === filterCriteria.status.toLowerCase()
          );
        }
        
        if (filterCriteria.search) {
          const searchTerm = filterCriteria.search.toLowerCase();
          filtered = filtered.filter(user => 
            (user.firstName || '').toLowerCase().includes(searchTerm) ||
            (user.lastName || '').toLowerCase().includes(searchTerm) ||
            (user.email || '').toLowerCase().includes(searchTerm)
          );
        }
        
        setFilteredUsers(filtered);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('Error filtering users');
      setLoading(false);
    }
  };

  // Reset filters and load all users
  const resetFilters = async () => {
    setFilterCriteria({
      role: '',
      status: '',
      search: ''
    });
    
    fetchUsers();
  };

  // Handle new user form input
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new user
  const addUser = async (e) => {
    e.preventDefault();
    
    try {
      setActionInProgress(true);
      
      // Call API to create user
      const response = await API.post('/users', newUser);
      console.log('User created:', response.data);
      
      // Add formatted user to the list
      const newUserFormatted = formatUserData(response.data);
      
      // Add to users array
      setUsers(prevUsers => [...prevUsers, newUserFormatted]);
      setFilteredUsers(prevUsers => [...prevUsers, newUserFormatted]);
      
      // Reset form and close modal
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
        status: 'active'
      });
      setShowAddUserModal(false);
      setActionInProgress(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.response?.data?.message || 'Unknown error'));
      setActionInProgress(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (id) => {
    try {
      setActionInProgress(true);
      const userToUpdate = users.find(user => user.id === id);
      // Ensure status has a default value if it's null
      const currentStatus = userToUpdate.status || 'inactive';
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Call API to update status
      const response = await API.put(`/users/${id}/status`, { status: newStatus });
      console.log('User status updated:', response.data);
      
      // Update local state with formatted user
      const updatedUser = formatUserData(response.data);
      const updatedUsers = users.map(user => {
        if (user.id === id) {
          return updatedUser;
        }
        return user;
      });
      
      setUsers(updatedUsers);
      // Update filtered users
      setFilteredUsers(updatedUsers.filter(user => matchesCurrentFilters(user)));
      setActionInProgress(false);
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status: ' + (error.response?.data?.message || 'Unknown error'));
      setActionInProgress(false);
    }
  };

  // Check if user matches current filters
  const matchesCurrentFilters = (user) => {
    // Role filter - handle null values
    if (filterCriteria.role && (user.role || '').toLowerCase() !== filterCriteria.role.toLowerCase()) {
      return false;
    }
    
    // Status filter - handle null values
    if (filterCriteria.status && (user.status || '').toLowerCase() !== filterCriteria.status.toLowerCase()) {
      return false;
    }
    
    // Search filter - handle null values
    if (filterCriteria.search) {
      const searchTerm = filterCriteria.search.toLowerCase();
      if (!(user.firstName || '').toLowerCase().includes(searchTerm) && 
          !(user.lastName || '').toLowerCase().includes(searchTerm) && 
          !(user.email || '').toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  };

  // Delete user
  const deleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setActionInProgress(true);
        // Call API to delete user
        await API.delete(`/users/${id}`);
        
        // Update local state
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers.filter(user => matchesCurrentFilters(user)));
        setActionInProgress(false);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + (error.response?.data?.message || 'Unknown error'));
        setActionInProgress(false);
      }
    }
  };

  // View user details
  const viewUser = (id) => {
    // You can implement navigation to user detail page
    // or show user details in a modal
    alert(`View user details for ID: ${id}`);
  };

  // Show loading state
  if (loading && users.length === 0) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && users.length === 0) {
    return (
      <div className="main-content">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={resetFilters}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>User Management</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowAddUserModal(true)}
            disabled={actionInProgress}
          >
            <i className="fas fa-plus"></i> Add New User
          </button>
        </div>
        
        {/* Filter Section */}
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select 
              id="role" 
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="professor">Professor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select 
              id="status" 
              name="status"
              value={filterCriteria.status}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input 
              type="text" 
              id="search" 
              name="search"
              placeholder="Search by name or email"
              value={filterCriteria.search}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={applyFilters}
            disabled={loading || actionInProgress}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button 
            className="btn-secondary"
            onClick={resetFilters}
            disabled={loading || actionInProgress}
          >
            Reset
          </button>
        </div>
        
        {/* User Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{`${user.firstName || ''} ${user.lastName || ''}`}</td>
                    <td>{user.email || ''}</td>
                    <td>
                      <span className="role-badge">
                        {user.role 
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() 
                          : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${(user.status || 'inactive') === 'active' ? 'approved' : 'pending'}`}>
                        {user.status 
                          ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                          : 'Inactive'}
                      </span>
                    </td>
                    <td>{user.lastLoginDisplay}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-table btn-view"
                          onClick={() => viewUser(user.id)}
                          disabled={actionInProgress}
                        >
                          View
                        </button>
                        <button 
                          className="btn-table btn-edit"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={actionInProgress}
                        >
                          {(user.status || 'inactive') === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="btn-table btn-delete"
                          onClick={() => deleteUser(user.id)}
                          disabled={actionInProgress}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <span 
                className="close-modal"
                onClick={() => !actionInProgress && setShowAddUserModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={addUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName"
                      value={newUser.firstName}
                      onChange={handleNewUserChange}
                      required 
                      disabled={actionInProgress}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName"
                      value={newUser.lastName}
                      onChange={handleNewUserChange}
                      required 
                      disabled={actionInProgress}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required 
                    disabled={actionInProgress}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required 
                    disabled={actionInProgress}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select 
                      id="role" 
                      name="role"
                      value={newUser.role}
                      onChange={handleNewUserChange}
                      required
                      disabled={actionInProgress}
                    >
                      <option value="admin">Admin</option>
                      <option value="professor">Professor</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select 
                      id="status" 
                      name="status"
                      value={newUser.status}
                      onChange={handleNewUserChange}
                      required
                      disabled={actionInProgress}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Adding...' : 'Add User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
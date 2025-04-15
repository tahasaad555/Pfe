import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/dashboard.css';

const SideNav = ({ 
  title, 
  logoSrc, 
  navLinks, 
  onLogout, 
  currentUser, 
  userRole 
}) => {
  return (
    <div className="sidebar-nav">
      <div className="sidebar-header">
        <img src={logoSrc} alt={`${title} Logo`} className="sidebar-logo" />
        <h2>{title.substring(0, title.length - 4)}<span>{title.substring(title.length - 4)}</span></h2>
      </div>
      
      {/* User Profile Section */}
      <div className="user-profile">
        <div className="user-avatar">
          {currentUser?.firstName?.charAt(0) || userRole.charAt(0)}
        </div>
        <div className="user-info">
          <div className="user-name">
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : userRole}
          </div>
          <div className="user-role">{userRole}</div>
        </div>
      </div>
      
      <ul className="nav-menu">
        {navLinks.map((link, index) => (
          <li className="nav-item" key={index}>
            <NavLink 
              to={link.to} 
              className={({ isActive }) => isActive ? 'active' : ''}
              end={link.exact}
            >
              <i className={link.icon}></i> {link.text}
            </NavLink>
          </li>
        ))}
        <li className="nav-item logout">
          <a href="#" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </a>
        </li>
      </ul>
    </div>
  );
};

export default SideNav;
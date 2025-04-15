package com.campusroom.dto;

import java.util.Date;

public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String status;
    private Date lastLogin;

    // Constructeurs
    public UserDTO() {
    }

    public UserDTO(Long id, String firstName, String lastName, String email,
                   String role, String status, Date lastLogin) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.status = status;
        this.lastLogin = lastLogin;
    }

    // Méthode builder statique
    public static Builder builder() {
        return new Builder();
    }

    // Classe Builder
    public static class Builder {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String status;
        private Date lastLogin;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder role(String role) {
            this.role = role;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder lastLogin(Date lastLogin) {
            this.lastLogin = lastLogin;
            return this;
        }

        public UserDTO build() {
            return new UserDTO(id, firstName, lastName, email, role, status, lastLogin);
        }
    }

    // Getters
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public Date getLastLogin() { return lastLogin; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setStatus(String status) { this.status = status; }
    public void setLastLogin(Date lastLogin) { this.lastLogin = lastLogin; }
}

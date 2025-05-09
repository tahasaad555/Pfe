// src/main/java/com/campusroom/dto/BranchDTO.java
package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDTO {
    private Long id;
    private String name;
    private String description;
    private List<ClassGroupDTO> classGroups = new ArrayList<>();
    private String lastUpdated;
    
    // Explicit getters and setters (in addition to @Data annotation for safety)
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public List<ClassGroupDTO> getClassGroups() {
        return classGroups;
    }
    
    public void setClassGroups(List<ClassGroupDTO> classGroups) {
        this.classGroups = classGroups;
    }
    
    public String getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    // Manual builder implementation as an extra precaution
    public static BranchDTOBuilder builder() {
        return new BranchDTOBuilder();
    }
    
    public static class BranchDTOBuilder {
        private Long id;
        private String name;
        private String description;
        private List<ClassGroupDTO> classGroups = new ArrayList<>();
        private String lastUpdated;
        
        public BranchDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public BranchDTOBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public BranchDTOBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public BranchDTOBuilder classGroups(List<ClassGroupDTO> classGroups) {
            this.classGroups = classGroups;
            return this;
        }
        
        public BranchDTOBuilder lastUpdated(String lastUpdated) {
            this.lastUpdated = lastUpdated;
            return this;
        }
        
        public BranchDTO build() {
            BranchDTO dto = new BranchDTO();
            dto.setId(this.id);
            dto.setName(this.name);
            dto.setDescription(this.description);
            dto.setClassGroups(this.classGroups);
            dto.setLastUpdated(this.lastUpdated);
            return dto;
        }
    }
}
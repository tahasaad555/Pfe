package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyRoomDTO {
    private String id;
    private String name;
    private String type;
    private int capacity;
    private List<String> features;
    private String availableTimes;
    private String image;
    
    // Getters existants
    public String getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getType() {
        return type;
    }
    
    public int getCapacity() {
        return capacity;
    }
    
    public List<String> getFeatures() {
        return features;
    }
    
    public String getAvailableTimes() {
        return availableTimes;
    }
    
    public String getImage() {
        return image;
    }
    
    // Setters existants
    public void setId(String id) {
        this.id = id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }
    
    public void setFeatures(List<String> features) {
        this.features = features;
    }
    
    public void setAvailableTimes(String availableTimes) {
        this.availableTimes = availableTimes;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
    
    // Implémentation manuelle du builder
    public static StudyRoomDTOBuilder builder() {
        return new StudyRoomDTOBuilder();
    }
    
    public static class StudyRoomDTOBuilder {
        private String id;
        private String name;
        private String type;
        private int capacity;
        private List<String> features;
        private String availableTimes;
        private String image;
        
        public StudyRoomDTOBuilder id(String id) {
            this.id = id;
            return this;
        }
        
        public StudyRoomDTOBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public StudyRoomDTOBuilder type(String type) {
            this.type = type;
            return this;
        }
        
        public StudyRoomDTOBuilder capacity(int capacity) {
            this.capacity = capacity;
            return this;
        }
        
        public StudyRoomDTOBuilder features(List<String> features) {
            this.features = features;
            return this;
        }
        
        public StudyRoomDTOBuilder availableTimes(String availableTimes) {
            this.availableTimes = availableTimes;
            return this;
        }
        
        public StudyRoomDTOBuilder image(String image) {
            this.image = image;
            return this;
        }
        
        public StudyRoomDTO build() {
            StudyRoomDTO studyRoomDTO = new StudyRoomDTO();
            studyRoomDTO.setId(this.id);
            studyRoomDTO.setName(this.name);
            studyRoomDTO.setType(this.type);
            studyRoomDTO.setCapacity(this.capacity);
            studyRoomDTO.setFeatures(this.features);
            studyRoomDTO.setAvailableTimes(this.availableTimes);
            studyRoomDTO.setImage(this.image);
            return studyRoomDTO;
        }
    }
}
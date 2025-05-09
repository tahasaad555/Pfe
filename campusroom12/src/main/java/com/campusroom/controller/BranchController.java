// src/main/java/com/campusroom/controller/BranchController.java
package com.campusroom.controller;

import com.campusroom.dto.BranchDTO;
import com.campusroom.service.BranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/branches")
@PreAuthorize("hasRole('ADMIN')")
public class BranchController {

    @Autowired
    private BranchService branchService;
    
    @GetMapping
    public ResponseEntity<List<BranchDTO>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getBranchById(id));
    }
    
    @PostMapping
    public ResponseEntity<BranchDTO> createBranch(@RequestBody BranchDTO branchDTO) {
        return ResponseEntity.ok(branchService.createBranch(branchDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BranchDTO> updateBranch(
            @PathVariable Long id, 
            @RequestBody BranchDTO branchDTO) {
        return ResponseEntity.ok(branchService.updateBranch(id, branchDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
package com.pcwms.backend.dto.request;

public class UpdateProfileRequest {
    private String username;   // Tên đăng nhập mới (tùy chọn)
    private String email;      // Email mới (tùy chọn)
    private String fullName;   // Họ và tên (CamelCase chuẩn hệ thống)
    private String phoneNumber;// Số điện thoại
    private String gender;     // Giới tính (Nam/Nữ)
    private String address;    // Địa chỉ liên lạc

    // Getter & Setter
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
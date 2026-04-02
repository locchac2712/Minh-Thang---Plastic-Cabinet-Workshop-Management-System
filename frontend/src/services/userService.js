import api from "./api";

const userService = {
    // GET /api/v1/user/profile
    getProfile: () => 
        api.get("/user/profile").then((res) => res.data),

    // PUT /api/v1/user/profile
    updateProfile: (profileData) =>
        api.put("/user/profile", profileData).then((res) => res.data),

    // PUT /api/v1/user/change-password
    changePassword: (passwords) =>
        api.put("/user/change-password", passwords).then((res) => res.data),
};

export default userService;

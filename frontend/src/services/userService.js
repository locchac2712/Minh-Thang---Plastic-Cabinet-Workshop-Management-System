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

    // ====== Admin: Quản lý người dùng ======

    // GET /api/v1/user  (danh sách tất cả user)
    getAllUsers: () =>
        api.get("/user").then((res) => res.data),

    // GET /api/v1/user/roles
    getAllRoles: () =>
        api.get("/user/roles").then((res) => res.data),

    // POST /api/v1/user (tạo user mới)
    createUser: (userData) =>
        api.post("/user", userData).then((res) => res.data),

    // PUT /api/v1/user/:id (cập nhật user)
    updateUser: (id, userData) =>
        api.put(`/user/${id}`, userData).then((res) => res.data),

    // DELETE /api/v1/user/:id
    deleteUser: (id) =>
        api.delete(`/user/${id}`).then((res) => res.data),

    // PUT /api/v1/user/:id/lock
    lockUser: (id) =>
        api.put(`/user/${id}/lock`).then((res) => res.data),

    // PUT /api/v1/user/:id/unlock
    unlockUser: (id) =>
        api.put(`/user/${id}/unlock`).then((res) => res.data),
};

export default userService;

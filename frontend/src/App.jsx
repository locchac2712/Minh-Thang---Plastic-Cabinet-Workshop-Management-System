import "./assets/global.css";
import "./assets/button.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ResetPassword }   from "./components/ResetPassword";
import { LoginModal }      from "./components/LoginModal";

const isResetPage = () => window.location.pathname.startsWith("/reset-password");

// Tách ra component riêng để dùng useAuth (phải nằm trong AuthProvider)
const AppContent = () => {
    const { user } = useAuth();

    if (isResetPage()) return <ResetPassword />;

    // Chưa đăng nhập → hiện trang Login toàn màn hình, không có nút đóng
    if (!user) return <LoginModal onClose={() => {}} />;

    // Đã đăng nhập → vào Dashboard
    return <DashboardLayout />;
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
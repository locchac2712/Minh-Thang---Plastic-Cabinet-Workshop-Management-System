import "./assets/global.css";
import "./assets/button.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout }      from "./layouts/MainLayout";
import { ResetPassword }   from "./pages/auth/ResetPassword";
import { Login }           from "./pages/auth/Login";

const isResetPage = () => window.location.pathname.startsWith("/reset-password");

const AppContent = () => {
    const { user, authLoading } = useAuth();

    // 1. Nếu đang trong quá trình xác thực Token khi load trang -> Hiện màn hình chờ
    if (authLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
                <div className="loading-spinner">Đang tải hệ thống...</div>
            </div>
        );
    }

    // 2. Các trang không cần login
    if (isResetPage()) return <ResetPassword />;

    // 3. Nếu chưa login (hoặc token hết hạn sau khi verify xong) -> Hiện Login
    if (!user) return <Login onClose={() => {}} />;

    // 4. Đã login -> Dùng chung một hệ thống Layout thông minh
    return <MainLayout />;
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
import "./assets/global.css";
import "./assets/button.css";
import { AuthProvider } from "./context/AuthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";

export default function App() {
  return (
    <AuthProvider>
      <DashboardLayout />
    </AuthProvider>
  );
}

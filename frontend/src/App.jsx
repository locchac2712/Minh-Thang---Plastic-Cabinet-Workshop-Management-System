import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import ProductForm from './pages/products/ProductForm'
import ProductDetail from './pages/products/ProductDetail'
import SupplierList from './pages/suppliers/SupplierList'
import SupplierForm from './pages/suppliers/SupplierForm'
import SupplierDetail from './pages/suppliers/SupplierDetail'
import WarehouseList from './pages/warehouses/WarehouseList'
import WarehouseForm from './pages/warehouses/WarehouseForm'
import WarehouseDetail from './pages/warehouses/WarehouseDetail'
import RawMaterialList from './pages/materials/RawMaterialList'
import RawMaterialForm from './pages/materials/RawMaterialForm'
import RawMaterialDetail from './pages/materials/RawMaterialDetail'
import BomList from './pages/bom/BomList'
import BomForm from './pages/bom/BomForm'
import BomDetail from './pages/bom/BomDetail'
import RoleList from './pages/roles/RoleList'
import RoleDetail from './pages/roles/RoleDetail'
import ApprovalList from './pages/approvals/ApprovalList'
import ApprovalDetail from './pages/approvals/ApprovalDetail'
import FinancialOverview from './pages/reports/FinancialOverview'
import RevenueReport from './pages/reports/RevenueReport'
import ReceivableReport from './pages/reports/ReceivableReport'
import CustomerList from './pages/customers/CustomerList'
import CustomerForm from './pages/customers/CustomerForm'
import CustomerDetail from './pages/customers/CustomerDetail'
import QuotationList from './pages/quotations/QuotationList'
import QuotationForm from './pages/quotations/QuotationForm'
import QuotationDetail from './pages/quotations/QuotationDetail'
import SalesOrderList from './pages/sales-orders/SalesOrderList'
import SalesOrderForm from './pages/sales-orders/SalesOrderForm'
import SalesOrderDetail from './pages/sales-orders/SalesOrderDetail'
import ProductionOrderList from './pages/production/ProductionOrderList'
import ProductionOrderForm from './pages/production/ProductionOrderForm'
import ProductionOrderDetail from './pages/production/ProductionOrderDetail'
import WorkOrderList from './pages/work-orders/WorkOrderList'
import WorkOrderForm from './pages/work-orders/WorkOrderForm'
import WorkOrderDetail from './pages/work-orders/WorkOrderDetail'
import InventoryList from './pages/inventory/InventoryList'
import InventoryDetail from './pages/inventory/InventoryDetail'
import StockForm from './pages/stock/StockForm'
import StockInList from './pages/stock/StockInList'
import StockOutList from './pages/stock/StockOutList'
import StockCountList from './pages/stock-counts/StockCountList'
import StockCountForm from './pages/stock-counts/StockCountForm'
import StockCountDetail from './pages/stock-counts/StockCountDetail'
import UserProfile from './pages/profile/UserProfile'
import UserList from './pages/users/UserList'
import UserForm from './pages/users/UserForm'
import UserDetail from './pages/users/UserDetail'
import MonitoringDashboard from './pages/dashboards/MonitoringDashboard'
import SalesStaffDashboard from './pages/dashboards/SalesStaffDashboard'
import SalesManagerDashboard from './pages/dashboards/SalesManagerDashboard'
import ProductionDashboard from './pages/dashboards/ProductionDashboard'
import WarehouseDashboard from './pages/dashboards/WarehouseDashboard'
import OperationalDashboard from './pages/dashboards/OperationalDashboard'
import DeliveryTracking from './pages/sales-orders/DeliveryTracking'
import PaymentReminders from './pages/sales-orders/PaymentReminders'
import QuotationHistory from './pages/quotations/QuotationHistory'
import ProfitReport from './pages/reports/ProfitReport'
import CustomerCredit from './pages/reports/CustomerCredit'
import TransactionHistory from './pages/reports/TransactionHistory'
import OverdueInvoices from './pages/reports/OverdueInvoices'
import InventoryOverview from './pages/reports/InventoryOverview'
import ProductionPerformance from './pages/reports/ProductionPerformance'
import StockAdjustments from './pages/stock/StockAdjustments'

const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  DIRECTOR: 'ROLE_DIRECTOR',
  SALES_STAFF: 'ROLE_SALES_STAFF',
  SALES_MANAGER: 'ROLE_SALES_MANAGER',
  WAREHOUSE_MANAGER: 'ROLE_WAREHOUSE_MANAGER',
  PRODUCTION_MANAGER: 'ROLE_PRODUCTION_MANAGER',
}

const ALL = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SALES_STAFF, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.PRODUCTION_MANAGER]
const PRODUCT_ROLES = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SALES_STAFF, ROLES.SALES_MANAGER, ROLES.PRODUCTION_MANAGER]
const SALES = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SALES_STAFF, ROLES.SALES_MANAGER]
const WH = [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER]
const PROD = [ROLES.ADMIN, ROLES.PRODUCTION_MANAGER]
const ADM_DIR = [ROLES.ADMIN, ROLES.DIRECTOR]
const REPORT = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SALES_MANAGER]

function getAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')
  return { token, user }
}

function getDefaultDashboard(role) {
  switch (role) {
    case ROLES.SALES_STAFF: return '/dashboard/sales-staff'
    case ROLES.SALES_MANAGER: return '/dashboard/sales-manager'
    case ROLES.PRODUCTION_MANAGER: return '/dashboard/production'
    case ROLES.WAREHOUSE_MANAGER: return '/dashboard/warehouse'
    case ROLES.ADMIN:
    case ROLES.DIRECTOR:
    default: return '/dashboard'
  }
}

function P({ children }) {
  const { token } = getAuth()
  return token ? children : <Navigate to="/login" replace />
}

function Pub({ children }) {
  const { token, user } = getAuth()
  return (token && user) ? <Navigate to={getDefaultDashboard(user?.role)} replace /> : children
}

function RequireRole({ allow, children }) {
  const { token, user } = getAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/403" replace />
  return children
}

function Forbidden() {
  const { user } = getAuth()
  return <Navigate to={user ? getDefaultDashboard(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Pub><Login /></Pub>} />
        <Route path="/forgot-password" element={<Pub><ForgotPassword /></Pub>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/403" element={<P><Forbidden /></P>} />

        <Route path="/dashboard" element={<RequireRole allow={ALL}><Dashboard /></RequireRole>} />

        <Route path="/products" element={<RequireRole allow={PRODUCT_ROLES}><ProductList /></RequireRole>} />
        <Route path="/products/new" element={<RequireRole allow={PRODUCT_ROLES}><ProductForm /></RequireRole>} />
        <Route path="/products/:id" element={<RequireRole allow={PRODUCT_ROLES}><ProductDetail /></RequireRole>} />
        <Route path="/products/:id/edit" element={<RequireRole allow={PRODUCT_ROLES}><ProductForm /></RequireRole>} />

        <Route path="/suppliers" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DIRECTOR]}><SupplierList /></RequireRole>} />
        <Route path="/suppliers/new" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DIRECTOR]}><SupplierForm /></RequireRole>} />
        <Route path="/suppliers/:id" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DIRECTOR]}><SupplierDetail /></RequireRole>} />
        <Route path="/suppliers/:id/edit" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DIRECTOR]}><SupplierForm /></RequireRole>} />

        <Route path="/warehouses" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER]}><WarehouseList /></RequireRole>} />
        <Route path="/warehouses/new" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER]}><WarehouseForm /></RequireRole>} />
        <Route path="/warehouses/:id" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER]}><WarehouseDetail /></RequireRole>} />
        <Route path="/warehouses/:id/edit" element={<RequireRole allow={[ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER]}><WarehouseForm /></RequireRole>} />
        <Route path="/materials" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.WAREHOUSE_MANAGER]}><RawMaterialList /></RequireRole>} />
        <Route path="/materials/new" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.WAREHOUSE_MANAGER]}><RawMaterialForm /></RequireRole>} />
        <Route path="/materials/:id" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.WAREHOUSE_MANAGER]}><RawMaterialDetail /></RequireRole>} />
        <Route path="/materials/:id/edit" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.WAREHOUSE_MANAGER]}><RawMaterialForm /></RequireRole>} />

        <Route path="/boms" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.DIRECTOR, ROLES.WAREHOUSE_MANAGER]}><BomList /></RequireRole>} />
        <Route path="/boms/new" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.DIRECTOR, ROLES.WAREHOUSE_MANAGER]}><BomForm /></RequireRole>} />
        <Route path="/boms/:id" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.DIRECTOR, ROLES.WAREHOUSE_MANAGER]}><BomDetail /></RequireRole>} />
        <Route path="/boms/:id/edit" element={<RequireRole allow={[ROLES.ADMIN, ROLES.PRODUCTION_MANAGER, ROLES.DIRECTOR, ROLES.WAREHOUSE_MANAGER]}><BomForm /></RequireRole>} />
        <Route path="/roles" element={<RequireRole allow={ADM_DIR}><RoleList /></RequireRole>} />
        <Route path="/roles/:role" element={<RequireRole allow={ADM_DIR}><RoleDetail /></RequireRole>} />

        <Route path="/approvals" element={<RequireRole allow={ADM_DIR}><ApprovalList /></RequireRole>} />
        <Route path="/approvals/:id" element={<RequireRole allow={ADM_DIR}><ApprovalDetail /></RequireRole>} />

        <Route path="/customers" element={<RequireRole allow={SALES}><CustomerList /></RequireRole>} />
        <Route path="/customers/new" element={<RequireRole allow={SALES}><CustomerForm /></RequireRole>} />
        <Route path="/customers/:id" element={<RequireRole allow={SALES}><CustomerDetail /></RequireRole>} />
        <Route path="/customers/:id/edit" element={<RequireRole allow={SALES}><CustomerForm /></RequireRole>} />

        <Route path="/quotations" element={<RequireRole allow={SALES}><QuotationList /></RequireRole>} />
        <Route path="/quotations/new" element={<RequireRole allow={SALES}><QuotationForm /></RequireRole>} />
        <Route path="/quotations/:id" element={<RequireRole allow={SALES}><QuotationDetail /></RequireRole>} />
        <Route path="/quotations/:id/edit" element={<RequireRole allow={SALES}><QuotationForm /></RequireRole>} />

        <Route path="/sales-orders" element={<RequireRole allow={SALES}><SalesOrderList /></RequireRole>} />
        <Route path="/sales-orders/new" element={<RequireRole allow={SALES}><SalesOrderForm /></RequireRole>} />
        <Route path="/sales-orders/:id" element={<RequireRole allow={SALES}><SalesOrderDetail /></RequireRole>} />

        <Route path="/production-orders" element={<RequireRole allow={PROD}><ProductionOrderList /></RequireRole>} />
        <Route path="/production-orders/new" element={<RequireRole allow={PROD}><ProductionOrderForm /></RequireRole>} />
        <Route path="/production-orders/:id" element={<RequireRole allow={PROD}><ProductionOrderDetail /></RequireRole>} />

        <Route path="/work-orders" element={<RequireRole allow={PROD}><WorkOrderList /></RequireRole>} />
        <Route path="/work-orders/new" element={<RequireRole allow={PROD}><WorkOrderForm /></RequireRole>} />
        <Route path="/work-orders/:id" element={<RequireRole allow={PROD}><WorkOrderDetail /></RequireRole>} />
        <Route path="/work-orders/:id/edit" element={<RequireRole allow={PROD}><WorkOrderForm /></RequireRole>} />

        <Route path="/inventory" element={<RequireRole allow={WH}><InventoryList /></RequireRole>} />
        <Route path="/inventory/:id" element={<RequireRole allow={WH}><InventoryDetail /></RequireRole>} />

        <Route path="/stock/in" element={<RequireRole allow={WH}><StockInList /></RequireRole>} />
        <Route path="/stock/out" element={<RequireRole allow={WH}><StockOutList /></RequireRole>} />
        <Route path="/stock/form" element={<RequireRole allow={WH}><StockForm /></RequireRole>} />
        <Route path="/stock/adjustments" element={<RequireRole allow={WH}><StockAdjustments /></RequireRole>} />

        <Route path="/stock-counts" element={<RequireRole allow={WH}><StockCountList /></RequireRole>} />
        <Route path="/stock-counts/new" element={<RequireRole allow={WH}><StockCountForm /></RequireRole>} />
        <Route path="/stock-counts/:id" element={<RequireRole allow={WH}><StockCountDetail /></RequireRole>} />

        <Route path="/profile" element={<RequireRole allow={ALL}><UserProfile /></RequireRole>} />
        <Route path="/users" element={<RequireRole allow={[ROLES.ADMIN]}><UserList /></RequireRole>} />
        <Route path="/users/new" element={<RequireRole allow={[ROLES.ADMIN]}><UserForm /></RequireRole>} />
        <Route path="/users/:id" element={<RequireRole allow={[ROLES.ADMIN]}><UserDetail /></RequireRole>} />
        <Route path="/users/:id/edit" element={<RequireRole allow={[ROLES.ADMIN]}><UserForm /></RequireRole>} />

        <Route path="/reports/financial" element={<RequireRole allow={ADM_DIR}><FinancialOverview /></RequireRole>} />
        <Route path="/reports/revenue" element={<RequireRole allow={REPORT}><RevenueReport /></RequireRole>} />
        <Route path="/reports/receivable" element={<RequireRole allow={REPORT}><ReceivableReport /></RequireRole>} />
        <Route path="/reports/profit" element={<RequireRole allow={ADM_DIR}><ProfitReport /></RequireRole>} />
        <Route path="/reports/credit" element={<RequireRole allow={REPORT}><CustomerCredit /></RequireRole>} />
        <Route path="/reports/transactions" element={<RequireRole allow={ADM_DIR}><TransactionHistory /></RequireRole>} />
        <Route path="/reports/overdue" element={<RequireRole allow={REPORT}><OverdueInvoices /></RequireRole>} />
        <Route path="/reports/inventory" element={<RequireRole allow={ADM_DIR}><InventoryOverview /></RequireRole>} />
        <Route path="/reports/production-performance" element={<RequireRole allow={ADM_DIR}><ProductionPerformance /></RequireRole>} />

        <Route path="/monitoring" element={<RequireRole allow={ADM_DIR}><MonitoringDashboard /></RequireRole>} />
        <Route path="/dashboard/sales-staff" element={<RequireRole allow={[ROLES.SALES_STAFF, ROLES.ADMIN]}><SalesStaffDashboard /></RequireRole>} />
        <Route path="/dashboard/sales-manager" element={<RequireRole allow={[ROLES.SALES_MANAGER, ROLES.ADMIN]}><SalesManagerDashboard /></RequireRole>} />
        <Route path="/dashboard/production" element={<RequireRole allow={[ROLES.PRODUCTION_MANAGER, ROLES.ADMIN]}><ProductionDashboard /></RequireRole>} />
        <Route path="/dashboard/warehouse" element={<RequireRole allow={[ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN]}><WarehouseDashboard /></RequireRole>} />
        <Route path="/dashboard/operational" element={<RequireRole allow={ADM_DIR}><OperationalDashboard /></RequireRole>} />

        <Route path="/delivery-tracking" element={<RequireRole allow={SALES}><DeliveryTracking /></RequireRole>} />
        <Route path="/payment-reminders" element={<RequireRole allow={[ROLES.ADMIN, ROLES.SALES_MANAGER]}><PaymentReminders /></RequireRole>} />
        <Route path="/quotations/history/:customerId" element={<RequireRole allow={SALES}><QuotationHistory /></RequireRole>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

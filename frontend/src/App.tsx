import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CatalogLayout } from './admin/layouts/CatalogLayout'
import { AdminCategoriesPage } from './admin/pages/AdminCategoriesPage'
import { AdminProductCreatePage } from './admin/pages/AdminProductCreatePage'
import { AdminProductDetailPage } from './admin/pages/AdminProductDetailPage'
import { AdminProductsPage } from './admin/pages/AdminProductsPage'
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage'
import { ManufacturingLayout } from './admin/layouts/ManufacturingLayout'
import { AdminMaterialCreatePage } from './admin/pages/AdminMaterialCreatePage'
import { AdminMaterialDetailPage } from './admin/pages/AdminMaterialDetailPage'
import { AdminBomPage } from './admin/pages/AdminBomPage'
import { AdminMaterialsPage } from './admin/pages/AdminMaterialsPage'
import { AdminUsersPage } from './admin/pages/AdminUsersPage'
import { AuthApiError, fetchMeProfile } from './auth/authApi'
import {
  type AppActor,
  clearAuthStorage,
  getAccessToken,
  getStoredActor,
  getTokenType,
  homePathForActor,
  isAuthenticated,
  syncAuthIdentityFromMe,
} from './auth/storage'
import { DirectorPanelLayout } from './layouts/DirectorPanelLayout'
import { ProductionPanelLayout } from './layouts/ProductionPanelLayout'
import { AccountantPanelLayout } from './layouts/AccountantPanelLayout'
import { AdminPanelLayout } from './layouts/AdminPanelLayout'
import { SellerPanelLayout } from './layouts/SellerPanelLayout'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DirectorDashboardPage } from './director/pages/DirectorDashboardPage'
import { DirectorPricingApprovalPage } from './director/pages/DirectorPricingApprovalPage'
import { DirectorPricingOrderDetailPage } from './director/pages/DirectorPricingOrderDetailPage'
import { DirectorDebtApprovalPage } from './director/pages/DirectorDebtApprovalPage'
import { DirectorReceivablesRiskPage } from './director/pages/DirectorReceivablesRiskPage'
import { DirectorWastagePage } from './director/pages/DirectorWastagePage'
import { DirectorMtsPage } from './director/pages/DirectorMtsPage'
import { PartnersLayout } from './director/layouts/PartnersLayout'
import { DirectorAgenciesPage } from './director/pages/partners/DirectorAgenciesPage'
import { DirectorAgencyCreatePage } from './director/pages/partners/DirectorAgencyCreatePage'
import { DirectorAgencyDetailPage } from './director/pages/partners/DirectorAgencyDetailPage'
import { DirectorSuppliersPage } from './director/pages/partners/DirectorSuppliersPage'
import { DirectorSupplierCreatePage } from './director/pages/partners/DirectorSupplierCreatePage'
import { DirectorSupplierDetailPage } from './director/pages/partners/DirectorSupplierDetailPage'
import { SellerDashboardPage } from './seller/pages/SellerDashboardPage'
import { SellerAgenciesPage } from './seller/pages/SellerAgenciesPage'
import { SellerAgencyCreatePage } from './seller/pages/SellerAgencyCreatePage'
import { SellerAgencyDetailPage } from './seller/pages/SellerAgencyDetailPage'
import { SellerStorePage } from './seller/pages/SellerStorePage'
import { SellerOrdersPage } from './seller/pages/SellerOrdersPage'
import { SellerOrderCreatePage } from './seller/pages/SellerOrderCreatePage'
import { SellerOrderDetailPage } from './seller/pages/SellerOrderDetailPage'
import { SellerPaymentsPage } from './seller/pages/SellerPaymentsPage'
import { SellerTrackingPage } from './seller/pages/SellerTrackingPage'
import { SellerQuotationsPage } from './seller/pages/SellerQuotationsPage'
import { SellerQuotationCreatePage } from './seller/pages/SellerQuotationCreatePage'
import { SellerQuotationDetailPage } from './seller/pages/SellerQuotationDetailPage'
import { ProductionActivityPage } from './production/pages/ProductionActivityPage'
import { ProductionBoardPage } from './production/pages/ProductionBoardPage'
import { ProductionTasksByOrderPage } from './production/pages/ProductionTasksByOrderPage'
import { ProductionTaskByOrderDetailPage } from './production/pages/ProductionTaskByOrderDetailPage'
import { ProductionTasksInternalPage } from './production/pages/ProductionTasksInternalPage'
import { ProductionTaskInternalDetailPage } from './production/pages/ProductionTaskInternalDetailPage'
import { ProductionInventoryWastagePage } from './production/pages/ProductionInventoryWastagePage'
import { ProductionInventoryStockPage } from './production/pages/ProductionInventoryStockPage'
import { ProductionInventoryLogsPage } from './production/pages/ProductionInventoryLogsPage'
import { ProductionCustomProductCreatePage } from './production/pages/ProductionCustomProductCreatePage'
import { ProductionDashboardPage } from './production/pages/ProductionDashboardPage'
import { AccountantDashboardPage } from './accountant/pages/AccountantDashboardPage'
import { AccountantPurchasingAlertsPage } from './accountant/pages/AccountantPurchasingAlertsPage'
import { AccountantPurchasingOrdersPage } from './accountant/pages/AccountantPurchasingOrdersPage'
import { AccountantPurchaseOrderDetailPage } from './accountant/pages/AccountantPurchaseOrderDetailPage'
import { AccountantInvoicesPage } from './accountant/pages/AccountantInvoicesPage'
import { AccountantInvoiceHistoryPage } from './accountant/pages/AccountantInvoiceHistoryPage'
import { AccountantPlaceholderPage } from './accountant/pages/AccountantPlaceholderPage'
import { AccountantPaymentsPage } from './accountant/pages/AccountantPaymentsPage'
import { AccountantSuppliersPage } from './accountant/pages/AccountantSuppliersPage'
import { AccountantMaterialsPage } from './accountant/pages/AccountantMaterialsPage'
import {
  ACCOUNTANT_PAYABLES_BILLS_ENABLED,
  ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED,
  accountantPaths,
} from './accountant/config/accountantPaths'
import './App.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RoleRoute({
  children,
  allowedActors,
}: {
  children: ReactNode
  allowedActors: readonly AppActor[]
}) {
  const actor = getStoredActor()
  if (!actor) {
    return <Navigate to="/login" replace />
  }
  if (!allowedActors.includes(actor)) {
    return <Navigate to={homePathForActor(actor)} replace />
  }
  return children
}

function AuthBootstrapGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(() => isAuthenticated())

  useEffect(() => {
    if (!isAuthenticated()) {
      setChecking(false)
      return
    }

    const accessToken = getAccessToken()
    if (!accessToken) {
      clearAuthStorage()
      setChecking(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchMeProfile({
          accessToken,
          tokenType: getTokenType(),
        })
        if (!me.isActive) {
          clearAuthStorage()
          return
        }
        syncAuthIdentityFromMe({
          role: me.role,
          fullName: me.fullName,
        })
      } catch (err) {
        if (err instanceof AuthApiError && err.statusCode === 401) {
          clearAuthStorage()
        } else if (err instanceof Error) {
          // Lỗi mạng: giữ session hiện tại, tránh đá user khỏi app khi backend chập chờn.
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return (
      <div className="app-auth-loading" role="status" aria-live="polite">
        Đang xác thực phiên đăng nhập...
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthBootstrapGate>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedActors={['admin']}>
              <AdminPanelLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="catalog" element={<CatalogLayout />}>
          <Route index element={<Navigate to="categories" replace />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="products/new" element={<AdminProductCreatePage />} />
          <Route path="products/:productId" element={<AdminProductDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
        </Route>
        <Route path="manufacturing" element={<ManufacturingLayout />}>
          <Route path="bom" element={<AdminBomPage />} />
          <Route path="materials/new" element={<AdminMaterialCreatePage />} />
          <Route path="materials/:materialId" element={<AdminMaterialDetailPage />} />
          <Route path="materials" element={<AdminMaterialsPage />} />
        </Route>
      </Route>
      <Route
        path="/seller"
        element={
          <ProtectedRoute>
            <RoleRoute allowedActors={['seller']}>
              <SellerPanelLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<SellerDashboardPage />} />
        <Route path="agencies/new" element={<SellerAgencyCreatePage />} />
        <Route path="agencies/:agencyId" element={<SellerAgencyDetailPage />} />
        <Route path="agencies" element={<SellerAgenciesPage />} />
        <Route path="store" element={<SellerStorePage />} />
        <Route path="orders/new" element={<SellerOrderCreatePage />} />
        <Route path="orders/:orderCode" element={<SellerOrderDetailPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="payments" element={<SellerPaymentsPage />} />
        <Route path="tracking" element={<SellerTrackingPage />} />
        <Route path="quotations/new" element={<SellerQuotationCreatePage />} />
        <Route path="quotations/:quotationId" element={<SellerQuotationDetailPage />} />
        <Route path="quotations" element={<SellerQuotationsPage />} />
      </Route>
      <Route
        path="/director"
        element={
          <ProtectedRoute>
            <RoleRoute allowedActors={['director']}>
              <DirectorPanelLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DirectorDashboardPage />} />
        <Route path="approvals">
          <Route index element={<Navigate to="pricing" replace />} />
          <Route path="pricing/:orderCode" element={<DirectorPricingOrderDetailPage />} />
          <Route path="pricing" element={<DirectorPricingApprovalPage />} />
          <Route path="debt" element={<DirectorDebtApprovalPage />} />
        </Route>
        <Route path="risk">
          <Route index element={<Navigate to="receivables" replace />} />
          <Route path="receivables" element={<DirectorReceivablesRiskPage />} />
          <Route path="wastage" element={<DirectorWastagePage />} />
        </Route>
        <Route path="mts" element={<DirectorMtsPage />} />
        <Route path="partners" element={<PartnersLayout />}>
          <Route index element={<Navigate to="agencies" replace />} />
          <Route path="agencies/new" element={<DirectorAgencyCreatePage />} />
          <Route path="agencies/:agencyId" element={<DirectorAgencyDetailPage />} />
          <Route path="agencies" element={<DirectorAgenciesPage />} />
          <Route path="suppliers/new" element={<DirectorSupplierCreatePage />} />
          <Route path="suppliers/:supplierId" element={<DirectorSupplierDetailPage />} />
          <Route path="suppliers" element={<DirectorSuppliersPage />} />
        </Route>
      </Route>
      <Route
        path="/production"
        element={
          <ProtectedRoute>
            <RoleRoute allowedActors={['production']}>
              <ProductionPanelLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ProductionBoardPage />} />
        <Route path="dashboard" element={<ProductionDashboardPage />} />
        <Route path="activity" element={<ProductionActivityPage />} />
        <Route path="tasks">
          <Route index element={<Navigate to="by-order" replace />} />
          <Route path="by-order/:taskId" element={<ProductionTaskByOrderDetailPage />} />
          <Route path="by-order" element={<ProductionTasksByOrderPage />} />
          <Route path="internal/:taskId" element={<ProductionTaskInternalDetailPage />} />
          <Route path="internal" element={<ProductionTasksInternalPage />} />
        </Route>
        <Route path="inventory">
          <Route index element={<Navigate to="wastage" replace />} />
          <Route path="wastage" element={<ProductionInventoryWastagePage />} />
          <Route path="stock" element={<ProductionInventoryStockPage />} />
          <Route path="logs" element={<ProductionInventoryLogsPage />} />
        </Route>
        <Route path="products/custom" element={<ProductionCustomProductCreatePage />} />
      </Route>
      <Route
        path="/accountant"
        element={
          <ProtectedRoute>
            <RoleRoute allowedActors={['accountant']}>
              <AccountantPanelLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AccountantDashboardPage />} />
        <Route path="receivables">
          <Route index element={<Navigate to="deposits" replace />} />
          <Route path="deposits" element={<AccountantPaymentsPage />} />
          <Route
            path="invoices"
            element={
              ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED ? (
                <AccountantInvoicesPage />
              ) : (
                <Navigate to={accountantPaths.receivables.deposits} replace />
              )
            }
          />
          <Route
            path="invoice-history"
            element={
              ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED ? (
                <AccountantInvoiceHistoryPage />
              ) : (
                <Navigate to={accountantPaths.receivables.deposits} replace />
              )
            }
          />
        </Route>
        <Route path="purchasing">
          <Route index element={<Navigate to="alerts" replace />} />
          <Route path="alerts" element={<AccountantPurchasingAlertsPage />} />
          <Route path="orders" element={<AccountantPurchasingOrdersPage />} />
          <Route path="orders/:purchaseId" element={<AccountantPurchaseOrderDetailPage />} />
        </Route>
        <Route
          path="payables/bills"
          element={
            ACCOUNTANT_PAYABLES_BILLS_ENABLED ? (
              <AccountantPlaceholderPage pageId="payablesBills" />
            ) : (
              <Navigate to={accountantPaths.purchasing.orders} replace />
            )
          }
        />
        <Route path="masters/suppliers" element={<AccountantSuppliersPage />} />
        <Route path="masters/materials" element={<AccountantMaterialsPage />} />
      </Route>
      <Route
        path="/"
        element={
          isAuthenticated() ? (
            <Navigate to={homePathForActor(getStoredActor() ?? 'admin')} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthBootstrapGate>
  )
}

export default App

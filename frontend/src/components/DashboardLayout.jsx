import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'

const I = ({ d }) => <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>

const ALL = ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_STAFF','ROLE_SALES_MANAGER','ROLE_WAREHOUSE_MANAGER','ROLE_PRODUCTION_MANAGER']
const SALES = ['ROLE_ADMIN','ROLE_SALES_STAFF','ROLE_SALES_MANAGER','ROLE_DIRECTOR']
const WH = ['ROLE_ADMIN','ROLE_WAREHOUSE_MANAGER']
const PROD = ['ROLE_ADMIN','ROLE_PRODUCTION_MANAGER']
const ADM = ['ROLE_ADMIN']
const ADM_DIR = ['ROLE_ADMIN','ROLE_DIRECTOR']

const sections = [
  { title: 'TỔNG QUAN', items: [
    { label: 'Dashboard', path: '/dashboard', roles: ALL, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { label: 'Giám sát KPI', path: '/monitoring', roles: ADM_DIR, icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  ]},
  { title: 'BÁN HÀNG', roles: SALES, items: [
    { label: 'Khách hàng', path: '/customers', roles: SALES, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { label: 'Báo giá', path: '/quotations', roles: SALES, icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { label: 'Đơn hàng', path: '/sales-orders', roles: SALES, icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
    { label: 'Giao hàng', path: '/delivery-tracking', roles: SALES, icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.139-.487 1.125-1.108l-.236-6.622A2.25 2.25 0 0018.139 9H6.862a2.25 2.25 0 00-2.245 2.028L4.38 17.642c-.014.621.504 1.108 1.125 1.108H6.75' },
    { label: 'Nhắc thanh toán', path: '/payment-reminders', roles: ['ROLE_ADMIN','ROLE_SALES_MANAGER'], icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  ]},
  { title: 'SẢN PHẨM', items: [
    { label: 'Sản phẩm', path: '/products', roles: ALL, icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    { label: 'Nhà cung cấp', path: '/suppliers', roles: ['ROLE_ADMIN','ROLE_WAREHOUSE_MANAGER','ROLE_DIRECTOR'], icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.139-.487 1.125-1.108l-.236-6.622A2.25 2.25 0 0018.139 9H6.862a2.25 2.25 0 00-2.245 2.028L4.38 17.642c-.014.621.504 1.108 1.125 1.108H6.75' },
  ]},
  { title: 'KHO HÀNG', roles: ['ROLE_ADMIN','ROLE_WAREHOUSE_MANAGER'], items: [
    { label: 'Quản lý kho', path: '/warehouses', roles: WH, icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' },
    { label: 'Tồn kho', path: '/inventory', roles: WH, icon: 'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3' },
    { label: 'Nhập kho', path: '/stock/in', roles: WH, icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' },
    { label: 'Xuất kho', path: '/stock/out', roles: WH, icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3' },
    { label: 'Điều chỉnh', path: '/stock/adjustments', roles: WH, icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75' },
    { label: 'Kiểm kê', path: '/stock-counts', roles: WH, icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
  ]},
  { title: 'SẢN XUẤT', roles: ['ROLE_ADMIN','ROLE_PRODUCTION_MANAGER','ROLE_DIRECTOR'], items: [
    { label: 'Nguyên vật liệu', path: '/materials', roles: ['ROLE_ADMIN','ROLE_PRODUCTION_MANAGER','ROLE_WAREHOUSE_MANAGER'], icon: 'M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25' },
    { label: 'BOM', path: '/boms', roles: ['ROLE_ADMIN','ROLE_PRODUCTION_MANAGER','ROLE_DIRECTOR','ROLE_WAREHOUSE_MANAGER'], icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
    { label: 'Lệnh sản xuất', path: '/production-orders', roles: PROD, icon: 'M11.42 15.17l-5.1-5.1a1.5 1.5 0 010-2.12l.88-.88a1.5 1.5 0 012.12 0l2.1 2.1 5.1-5.1a1.5 1.5 0 012.12 0l.88.88a1.5 1.5 0 010 2.12l-7.98 7.98a1.5 1.5 0 01-2.12 0z' },
    { label: 'Work Order', path: '/work-orders', roles: PROD, icon: 'M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z' },
  ]},
  { title: 'HỆ THỐNG', roles: ADM_DIR, items: [
    { label: 'Người dùng', path: '/users', roles: ADM, icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
    { label: 'Vai trò', path: '/roles', roles: ADM_DIR, icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
    { label: 'Phê duyệt', path: '/approvals', roles: ADM_DIR, icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]},
  { title: 'BÁO CÁO', roles: ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_MANAGER'], items: [
    { label: 'Tài chính', path: '/reports/financial', roles: ADM_DIR, icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
    { label: 'Doanh thu', path: '/reports/revenue', roles: ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_MANAGER'], icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { label: 'Lợi nhuận', path: '/reports/profit', roles: ADM_DIR, icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
    { label: 'Công nợ', path: '/reports/receivable', roles: ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_MANAGER'], icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Tín dụng KH', path: '/reports/credit', roles: ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_MANAGER'], icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    { label: 'Nợ quá hạn', path: '/reports/overdue', roles: ['ROLE_ADMIN','ROLE_DIRECTOR','ROLE_SALES_MANAGER'], icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  ]},
]

export default function DashboardLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('sidebar-scroll')
    if (navRef.current && saved) {
      navRef.current.scrollTop = Number(saved)
    }
  }, [location.pathname])

  const handleNavClick = () => {
    if (navRef.current) {
      sessionStorage.setItem('sidebar-scroll', navRef.current.scrollTop)
    }
    setOpen(false)
  }

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    sessionStorage.removeItem('token'); sessionStorage.removeItem('user')
    navigate('/login')
  }

  const active = (p) => location.pathname === p || (p !== '/dashboard' && location.pathname.startsWith(p + '/'))

  return (
    <div className="min-h-screen bg-white selection:bg-purple-200 selection:text-purple-900">
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-white/80 backdrop-blur-xl border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-20 flex items-center gap-2 px-6 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-gray-900">Minh Thang<span className="opacity-30">_</span></span>
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
          {sections.map(s => {
            const sectionVisible = !s.roles || s.roles.includes(user.role)
            const visibleItems = s.items.filter(item => !item.roles || item.roles.includes(user.role))
            if (!sectionVisible && visibleItems.length === 0) return null
            if (visibleItems.length === 0) return null
            return (
              <div key={s.title}>
                <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">{s.title}</p>
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <Link key={item.path} to={item.path} onClick={handleNavClick}
                      data-active={active(item.path) || undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active(item.path)
                          ? 'bg-[#F3F0FF] text-purple-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}>
                      <I d={item.icon} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-transparent">
          <div className="px-6 h-20 flex items-center justify-between max-w-[1440px] mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-50 text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* User dropdown */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-[#F3F0FF] flex items-center justify-center text-purple-700 text-sm font-bold">
                    {(user.fullName || 'U').charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{user.fullName || 'User'}</p>
                    <p className="text-[10px] text-gray-400">{user.role}</p>
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 py-2 z-50 animate-fade-in">
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      Hồ sơ cá nhân
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="px-6 py-6 max-w-[1440px] mx-auto">{children}</main>
      </div>
    </div>
  )
}

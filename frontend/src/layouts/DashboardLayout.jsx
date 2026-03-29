import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'

const I = ({ d }) => <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>

const ALL = ['ROLE_ADMIN', 'ROLE_DIRECTOR', 'ROLE_SALES_STAFF', 'ROLE_SALES_MANAGER', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_PRODUCTION_MANAGER']
const SALES = ['ROLE_ADMIN', 'ROLE_SALES_STAFF', 'ROLE_SALES_MANAGER', 'ROLE_DIRECTOR']
const WH = ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER']
const PROD = ['ROLE_ADMIN', 'ROLE_PRODUCTION_MANAGER']
const ADM = ['ROLE_ADMIN']
const ADM_DIR = ['ROLE_ADMIN', 'ROLE_DIRECTOR']

function getDashboardPath(role) {
  switch (role) {
    case 'ROLE_SALES_STAFF': return '/dashboard/sales-staff'
    case 'ROLE_SALES_MANAGER': return '/dashboard/sales-manager'
    case 'ROLE_PRODUCTION_MANAGER': return '/dashboard/production'
    case 'ROLE_WAREHOUSE_MANAGER': return '/dashboard/warehouse'
    case 'ROLE_DIRECTOR': return '/dashboard/director'
    default: return '/dashboard'
  }
}

const sections = [
  {
    title: 'TỔNG QUAN', items: [
      { label: 'Dashboard', path: '__DASHBOARD__', roles: ALL, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    ]
  },
  {
    title: 'SẢN PHẨM', items: [
      { label: 'Sản phẩm', path: '/products', roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR', 'ROLE_SALES_STAFF', 'ROLE_SALES_MANAGER', 'ROLE_PRODUCTION_MANAGER'], icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
      { label: 'Nguyên vật liệu', path: '/materials', roles: ['ROLE_ADMIN', 'ROLE_PRODUCTION_MANAGER', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M14 6H21m-7 6H21m-7 6H21m-9-6v.01M5 12v.01M5 18v.01M5 6v.01' },
      { label: 'Nhà cung cấp', path: '/suppliers', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_DIRECTOR'], icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.139-.487 1.125-1.108l-.236-6.622A2.25 2.25 0 0018.139 9H6.862a2.25 2.25 0 00-2.245 2.028L4.38 17.642c-.014.621.504 1.108 1.125 1.108H6.75' },
    ]
  },
  {
    title: 'SẢN XUẤT', roles: [...PROD, 'ROLE_DIRECTOR'], items: [
      { label: 'Lệnh sản xuất', path: '/production-orders', roles: [...PROD, 'ROLE_DIRECTOR'], icon: 'M11.42 15.17l-5.58-3.37V7.82l5.58 3.37v3.98zm1.16-4.7L18.16 7.1l-5.58-3.37L7 7.1l5.58 3.37zm6.92-5.97L12.58.37a1.22 1.22 0 00-1.16 0L4.5 4.5a1.19 1.19 0 00-.58 1.02V15.48c0 .42.22.8.58 1.02l6.92 4.13c.36.21.8.21 1.16 0l6.92-4.13c.36-.22.58-.6.58-1.02V5.52c0-.42-.22-.8-.58-1.02z' },
      { label: 'Work Order', path: '/work-orders', roles: [...PROD, 'ROLE_DIRECTOR'], icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
      { label: 'Định mức (BOM)', path: '/boms', roles: [...PROD, 'ROLE_DIRECTOR', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125z' },
    ]
  },
  {
    title: 'KHO HÀNG', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], items: [
      { label: 'Tồn kho', path: '/inventory', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
      { label: 'Nhập kho', path: '/stock/in', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' },
      { label: 'Xuất kho', path: '/stock/out', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3' },
      { label: 'Tạo phiếu X/N', path: '/stock/form', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M12 4.5v15m7.5-7.5h-15' },
      { label: 'Kiểm kê', path: '/stock-counts', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
      { label: 'Cấu hình Kho', path: '/warehouses', roles: ['ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER'], icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' },
    ]
  },
  {
    title: 'BÁN HÀNG', roles: SALES, items: [
      { label: 'Khách hàng', path: '/customers', roles: SALES, icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
      { label: 'Báo giá', path: '/quotations', roles: SALES, icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
      { label: 'Đơn bán hàng', path: '/sales-orders', roles: SALES, icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
      { label: 'Giao hàng', path: '/delivery-tracking', roles: SALES, icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.139-.487 1.125-1.108l-.236-6.622A2.25 2.25 0 0018.139 9H6.862a2.25 2.25 0 00-2.245 2.028L4.38 17.642c-.014.621.504 1.108 1.125 1.108H6.75' },
    ]
  },
  {
    title: 'HỆ THỐNG', roles: ADM_DIR, items: [
      { label: 'Người dùng', path: '/users', roles: ADM, icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
    ]
  },
]

export default function DashboardLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
  const dashboardPath = getDashboardPath(user.role)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed)
  }, [collapsed])

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

  const resolveItemPath = (p) => p === '__DASHBOARD__' ? dashboardPath : p
  const active = (p) => {
    const resolved = resolveItemPath(p)
    return location.pathname === resolved || (resolved !== '/dashboard' && location.pathname.startsWith(resolved + '/'))
  }

  return (
    <div className="min-h-screen bg-white selection:bg-purple-200 selection:text-purple-900">
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full ${collapsed ? 'w-[72px]' : 'w-[260px]'} bg-slate-900 border-r border-slate-800 transform transition-all duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl shadow-black/20`}>
        <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-6'} border-b border-slate-800 shrink-0 transition-all duration-300`}>
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          {!collapsed && <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap overflow-hidden">Minh Thang<span className="opacity-30">_</span></span>}
        </div>

        <nav ref={navRef} className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar">
          {sections.map(s => {
            const sectionVisible = !s.roles || s.roles.includes(user.role)
            const visibleItems = s.items.filter(item => !item.roles || item.roles.includes(user.role))
            if (!sectionVisible && visibleItems.length === 0) return null
            if (visibleItems.length === 0) return null
            return (
              <div key={s.title}>
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <Link key={item.path} to={resolveItemPath(item.path)} onClick={handleNavClick}
                      data-active={active(item.path) || undefined}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center ${collapsed ? 'justify-center mx-auto w-11 h-11' : 'gap-3 px-3 py-2'} rounded-xl text-[13px] font-medium transition-all duration-200 ${active(item.path)
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}>
                      <I d={item.icon} />
                      {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
        {/* Topbar */}
        <nav className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
          <div className="px-6 h-20 flex items-center justify-between max-w-[1440px] mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-800 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 -ml-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
              </button>
              <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-5">
              {/* Notification icon */}
              <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-900"></div>
              </button>

              <div className="w-px h-8 bg-slate-800 mx-1"></div>

              {/* User dropdown */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-600/20">
                    {(user.fullName || 'U').charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-tight">{user.fullName || 'User'}</p>
                    <p className="text-[10px] text-slate-500">{user.role}</p>
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

export { DashboardLayout };

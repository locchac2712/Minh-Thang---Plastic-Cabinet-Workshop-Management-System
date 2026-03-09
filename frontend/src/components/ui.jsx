import { Link } from 'react-router-dom'

/* ── Vantage v2 Design System ── */

export function PageHeader({ title, desc, action, actionLabel = 'Thêm mới', actionTo, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">{title}</h2>
        {desc && <p className="text-gray-500 mt-2 text-base font-normal leading-relaxed">{desc}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {children}
        {actionTo && (
          <Link to={actionTo} className="group inline-flex items-center gap-2 bg-white text-gray-900 pl-5 pr-2 py-2 rounded-full text-sm font-medium shadow-lg shadow-purple-900/5 transition-transform hover:scale-[1.02] hover:shadow-xl border border-gray-100 active:scale-[0.98]">
            <span>{actionLabel}</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
          </Link>
        )}
        {action && (
          <button onClick={action} className="group inline-flex items-center gap-2 bg-white text-gray-900 pl-5 pr-2 py-2 rounded-full text-sm font-medium shadow-lg shadow-purple-900/5 hover:scale-[1.02] hover:shadow-xl border border-gray-100 transition-transform active:scale-[0.98]">
            <span>{actionLabel}</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export function Card({ children, className = '', animate = true }) {
  return (
    <div className={`bg-white rounded-[32px] border border-gray-100/50 shadow-sm ring-1 ring-black/[0.02] ${animate ? 'animate-fade-in-up' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function GlassCard({ children, className = '' }) {
  return (
    <div className={`bg-white/60 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.08)] ${className}`}>
      {children}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full sm:w-80 bg-white border border-gray-200 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 shadow-sm" />
    </div>
  )
}

export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up delay-100">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
            active === tab.value
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/10'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Table({ headers, children }) {
  return (
    <Card className="overflow-hidden animate-fade-in-up delay-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-[#FAFAFF]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
      </div>
    </Card>
  )
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3.5 text-sm ${className}`}>{children}</td>
}

export function Badge({ variant = 'gray', children }) {
  const c = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    red: 'bg-red-50 text-red-700 ring-red-600/10',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    purple: 'bg-purple-50 text-purple-700 ring-purple-600/10',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    gray: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset ${c[variant] || c.gray}`}>{children}</span>
}

export function Field({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      {children || (
        <input {...props} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 shadow-sm" />
      )}
    </div>
  )
}

export function TextArea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <textarea {...props} rows={props.rows || 3}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none placeholder:text-gray-400 shadow-sm" />
    </div>
  )
}

export function Select({ label, options = [], value, onChange, placeholder = 'Chọn...', ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select value={value} onChange={onChange} {...props}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Btn({ children, variant = 'primary', className = '', ...props }) {
  const s = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 active:scale-[0.98]',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10',
    purple: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/10',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  }
  return <button {...props} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all inline-flex items-center gap-2 ${s[variant] || s.primary} ${className}`}>{children}</button>
}

export function LinkBtn({ to, children, variant = 'primary', className = '' }) {
  const s = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
    purple: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/10',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  }
  return <Link to={to} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all inline-flex items-center gap-2 ${s[variant]} ${className}`}>{children}</Link>
}

export function DetailGrid({ items }) {
  return (
    <Card className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
            <div className="text-sm font-medium text-gray-900">{item.value || '—'}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function StatCard({ label, value, color = 'purple', desc }) {
  const dots = {
    purple: 'bg-purple-500', blue: 'bg-blue-500', green: 'bg-emerald-500',
    orange: 'bg-orange-500', red: 'bg-red-500', cyan: 'bg-cyan-500',
  }
  return (
    <Card className="p-6 hover:shadow-xl hover:shadow-purple-900/5 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dots[color] || dots.purple}`}></div>
        <p className="text-sm text-gray-500 font-normal">{label}</p>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-gray-900">{value ?? '—'}</p>
      {desc && <p className="text-xs text-gray-400 mt-2">{desc}</p>}
    </Card>
  )
}

export function Alert({ type = 'error', message, onClose }) {
  if (!message) return null
  const s = {
    error: 'bg-red-50 border-red-100 text-red-700',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    info: 'bg-blue-50 border-blue-100 text-blue-700',
  }
  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-3 mb-6 animate-fade-in-up ${s[type]}`}>
      <p className="text-sm flex-1">{message}</p>
      {onClose && <button onClick={onClose} className="opacity-50 hover:opacity-100 text-lg leading-none">&times;</button>}
    </div>
  )
}

export function Loading({ text = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <svg className="w-8 h-8 animate-spin-slow text-purple-400 mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

export function EmptyState({ message = 'Không có dữ liệu', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-[#F3F0FF] flex items-center justify-center text-gray-400 mb-4 text-2xl">
        {icon || '📋'}
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

export function ActionLink({ to, icon, title }) {
  return (
    <Link to={to} title={title}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
      {icon}
    </Link>
  )
}

export function ActionBtn({ icon, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
      {icon}
    </button>
  )
}

export const Icons = {
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  back: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  toggle: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
}

export const fmt = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(v) : '—'
export const fmtCurrency = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(v) + ' đ' : '—'
export const fmtDate = (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'

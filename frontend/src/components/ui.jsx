import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ── Vantage v2 Design System ── */

export function PageHeader({ title, desc, action, actionLabel = 'Thêm mới', actionTo, children }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 animate-fade-in-up">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 truncate pb-1">{title}</h2>
        {desc && <p className="text-gray-500 mt-2 text-sm md:text-base font-medium leading-relaxed max-w-2xl">{desc}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-shrink-0">
        {children}
        {(actionTo || action) && (
          <div className="flex gap-2 min-w-fit">
            {actionTo && (
              <Link to={actionTo} className="group inline-flex items-center gap-2 bg-purple-600 text-white pl-5 pr-2 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.97]">
                <span>{actionLabel}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
              </Link>
            )}
            {action && (
              <button onClick={action} className="group inline-flex items-center gap-2 bg-purple-600 text-white pl-5 pr-2 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.97]">
                <span>{actionLabel}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
              </button>
            )}
          </div>
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

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 shadow-sm" />
    </div>
  )
}

export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up delay-100">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${active === tab.value
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/10'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
            }`}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Table({ headers, children, className = '', containerClassName = 'overflow-x-auto' }) {
  return (
    <Card className={`animate-fade-in-up delay-200 ${className}`}>
      <div className={containerClassName}>
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

export function Field({ label, children, error, required, icon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
            {icon}
          </span>
        )}
        {children || (
          <input {...props} className={`w-full bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl ${icon ? 'pl-11' : 'px-4'} py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 shadow-sm`} />
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export function TextArea({ label, error, required, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea {...props} rows={props.rows || 3}
        className={`w-full bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none placeholder:text-gray-400 shadow-sm`} />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, options = [], value, onChange, error, required, hidePlaceholder = false, placeholder = 'Chọn...', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select value={value} onChange={onChange} {...props}
        className={`w-full bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm`}>
        {!hidePlaceholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export function DatePicker({ label, value, onChange, error, required, icon, placeholder = 'Chọn ngày...' }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Parse YYYY-MM-DD to local Date
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date()
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const [viewDate, setViewDate] = useState(parseLocalDate(value))
  const ref = useRef(null)

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) setViewDate(parseLocalDate(value))
  }, [value])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }
  const handleNextMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleSelectDate = (day) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    // Format to YYYY-MM-DD in local time
    const y = selected.getFullYear()
    const m = String(selected.getMonth() + 1).padStart(2, '0')
    const d = String(selected.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setIsOpen(false)
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = []
  const startDay = startDayOfMonth(year, month)
  const totalDays = daysInMonth(year, month)

  const prevMonthTotalDays = daysInMonth(year, month - 1)
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthTotalDays - i, current: false })
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, current: true })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false })
  }

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  const isToday = (d) => {
    const today = new Date()
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
  }

  const isSelected = (d) => {
    if (!value) return false
    const sel = new Date(value)
    return sel.getDate() === d && sel.getMonth() === month && sel.getFullYear() === year
  }

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={ref}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`w-full h-11 bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 flex items-center gap-3 cursor-pointer hover:border-purple-300 transition-all shadow-sm group`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400 group-hover:text-purple-500 transition-colors">
          {icon || Icons.calendar}
        </span>
        <span className={`text-sm font-medium ${!value ? 'text-gray-300' : 'text-gray-900'}`}>
          {value ? new Date(value).toLocaleDateString('vi-VN') : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[120] w-[280px] animate-fade-in animate-scale-in origin-top-left">
          <div className="flex items-center justify-between mb-4 px-1">
            <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all">
              {Icons.ChevronLeft}
            </button>
            <span className="text-sm font-bold text-gray-900">{monthNames[month]} {year}</span>
            <button onClick={handleNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all">
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-300 uppercase">
            {dayNames.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((item, i) => (
              <button
                key={i}
                disabled={!item.current}
                onClick={(e) => { e.stopPropagation(); handleSelectDate(item.day) }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  !item.current 
                    ? 'text-gray-100 cursor-default' 
                    : isSelected(item.day)
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : isToday(item.day)
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.day}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
             <button 
                onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false) }}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase px-2"
              >
                Xóa
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                className="text-[10px] font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase px-2"
              >
                Đóng
              </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  )
}

export function Dropdown({ value, onChange, options = [], placeholder = 'Chọn...', label, required, error, className = '', up = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-all shadow-sm group`}
        onClick={() => setOpen(!open)}
      >
        <span className={`${!selected ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {open && (
        <div className={`absolute ${up ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-fade-in py-1 max-h-60 overflow-y-auto custom-scrollbar`}>
          {placeholder && !required && (
            <button 
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors ${!value ? 'text-purple-600 font-bold' : 'text-gray-600'}`}
            >
              {placeholder}
            </button>
          )}
          {options.map(o => (
            <button 
              key={o.value} 
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors ${String(value) === String(o.value) ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-gray-600'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export function ComboBox({ value, onChange, options = [], placeholder = 'Tìm kiếm...', label, required, error, onCreateNew }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(o => String(o.value) === String(value))
  
  const filtered = search 
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options.slice(0, 3)

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-all shadow-sm group`}
        onClick={() => setOpen(!open)}
      >
        <span className={`${!selected ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-fade-in flex flex-col max-h-72">
          <div className="p-3 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              autoFocus
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-300 font-medium"
              placeholder="Gõ để tìm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
            {onCreateNew && (
              <button 
                className="w-full px-4 py-2.5 text-left text-sm text-purple-600 font-bold hover:bg-purple-50 transition-colors flex items-center gap-2 border-b border-gray-50"
                onClick={(e) => { e.stopPropagation(); onCreateNew(); setOpen(false) }}
              >
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">+</span>
                Thêm mới nhanh...
              </button>
            )}

            {!search && filtered.length > 0 && (
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">Gần đây</div>
            )}

            {filtered.length > 0 ? filtered.map(o => (
              <button 
                key={o.value} 
                onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between group ${String(value) === String(o.value) ? 'bg-purple-50/50 text-purple-700 font-bold' : 'text-gray-600'}`}
              >
                <span>{o.label}</span>
                {String(value) === String(o.value) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </button>
            )) : (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-400 text-xs italic">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
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
    <Card className="p-6 hover:shadow-xl hover:shadow-purple-900/5 hover:-translate-y-1 transition-all duration-300 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dots[color] || dots.purple}`}></div>
        <p className="text-sm text-gray-500 font-semibold truncate">{label}</p>
      </div>
      <p className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 truncate">{value ?? '—'}</p>
      {desc && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{desc}</p>}
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

export function Pagination({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-gray-50 bg-[#FAFAFF] rounded-b-[32px]">
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">Hiển thị</span>
        <Dropdown value={pageSize} onChange={(val) => onPageSizeChange(Number(val))} options={[5, 10, 15, 20].map(s => ({ value: s, label: String(s) }))} className="min-w-max w-20" placeholder={null} required={true} up={true} />
        <span className="text-xs text-gray-500">trên {totalItems} kết quả</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 disabled:opacity-30 hover:bg-white transition-all"
        >
          &lsaquo;
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              currentPage === page 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 disabled:opacity-30 hover:bg-white transition-all"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full ${maxWidth} overflow-hidden animate-scale-in`}>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors text-2xl">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-white h-full w-full ${width} shadow-2xl border-l border-gray-100 flex flex-col transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all text-2xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', variant = 'primary' }) {
  if (!isOpen) return null
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export const Icons = {
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  back: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  toggle: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  filter: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>,
  ChevronLeft: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
  User: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  Check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  Loading: <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  close: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  print: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.821V7.443c0-1.216.925-2.256 2.141-2.296A51.964 51.964 0 0115 5.147c1.216.037 2.141 1.077 2.141 2.296v6.378m-10.421 0c-1.091-.039-2.145.118-3.13.46a2.25 2.25 0 00-1.53 2.106v1.942c0 .91.666 1.674 1.53 2.106a24.948 24.948 0 003.13.46m10.421-7.074c1.091-.039 2.145.118-3.13.46a2.25 2.25 0 011.53 2.106v1.942c0 .91-.666 1.674-1.53 2.106a24.948 24.948 0 01-3.13.46M12 18.75a6 6 0 006-6H6a6 6 0 006 6z" /></svg>,
  save: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  calendar: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  currency: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
}

export const fmt = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(v) : '—'
export const fmtCurrency = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(v) + ' đ' : '—'
export const fmtDate = (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'

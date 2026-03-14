import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { 
  PageHeader, FilterTabs, Loading, EmptyState, Table, Td, Badge, 
  ActionLink, Icons, fmtCurrency, fmtDate, Card, GlassCard, Btn, SearchBar 
} from '../../components/ui'
import quotationService from '../../services/quotationService'

const STAGES = [
  { id: 'new', label: 'Khách mới', color: 'blue', statuses: ['DRAFT'] },
  { id: 'prospect', label: 'Khách hàng tiềm năng', color: 'purple', statuses: ['SENT'] },
  { id: 'negotiating', label: 'Khách đang trao đổi', color: 'yellow', statuses: [] },
  { id: 'won', label: 'Khách mua hàng', color: 'green', statuses: ['APPROVED', 'ACCEPTED'] },
]

export default function QuotationList() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'list'
  const [search, setSearch] = useState('')

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const data = await quotationService.getAll()
      setQuotations(data || [])
    } catch {
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuotations() }, [])

  // Group quotations by stages
  const groupedData = useMemo(() => {
    const groups = { new: [], prospect: [], negotiating: [], won: [] }
    
    quotations.forEach(q => {
      if (q.status === 'APPROVED' || q.status === 'ACCEPTED') groups.won.push(q)
      else if (q.status === 'SENT') groups.prospect.push(q)
      else if (q.status === 'DRAFT') groups.new.push(q)
      else groups.negotiating.push(q)
    })
    
    // Filter by search
    if (search) {
      Object.keys(groups).forEach(key => {
        groups[key] = groups[key].filter(q => 
          q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
          q.customer?.name?.toLowerCase().includes(search.toLowerCase())
        )
      })
    }
    
    return groups
  }, [quotations, search])

  const totalAmount = (list) => list.reduce((sum, q) => sum + (q.totalAmount || 0), 0)

  return (
    <DashboardLayout>
      <PageHeader 
        title="Quản lý Báo giá" 
        desc="Theo dõi quy trình bán hàng và chốt đơn" 
        actionTo="/quotations/new" 
        actionLabel="Tạo báo giá"
      >
        <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 shadow-inner">
          <button 
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-full transition-all ${viewMode === 'kanban' ? 'bg-white shadow-md text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Giao diện Kanban"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Giao diện danh sách"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </PageHeader>

      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <SearchBar 
          placeholder="Tìm báo giá hoặc khách hàng..."
          className="w-full md:w-96"
          value={search}
          onChange={setSearch}
        />
        <div className="hidden md:flex gap-6 items-center px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm font-medium">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Tổng báo giá</span>
            <span className="text-gray-900">{quotations.length}</span>
          </div>
          <div className="w-px h-6 bg-gray-100"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Giá trị dự kiến</span>
            <span className="text-purple-600 font-bold">{fmtCurrency(totalAmount(quotations))}</span>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : quotations.length === 0 ? <EmptyState message="Không có báo giá nào" /> : (
        <div className="animate-fade-in">
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start overflow-x-auto pb-6">
              {STAGES.map(stage => (
                <div key={stage.id} className="min-w-[280px] flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${stage.color}-500 shadow-lg shadow-${stage.color}-500/30`}></div>
                      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{stage.label}</h3>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {groupedData[stage.id].length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">{fmtCurrency(totalAmount(groupedData[stage.id]))}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 min-h-[200px] p-2 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                    {groupedData[stage.id].map(q => (
                      <GlassCard key={q.id} className="p-4 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                        <ActionLink to={`/quotations/${q.id}`} className="absolute top-4 right-4" />
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-gray-400 tracking-tighter uppercase">{q.quotationNumber}</span>
                            <Badge variant={stage.color}>{q.status}</Badge>
                          </div>
                          <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">{q.customer?.name || 'Vãng lai'}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-black text-gray-800 tracking-tight">{fmtCurrency(q.totalAmount)}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{fmtDate(q.createdDate || q.createdAt)}</span>
                          </div>
                          <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-600">
                              {q.salesStaff?.fullName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium truncate">{q.salesStaff?.fullName || 'Chưa gán'}</span>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                    {groupedData[stage.id].length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-gray-300 italic text-xs">Phễu chưa có báo giá</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {STAGES.map(stage => groupedData[stage.id].length > 0 && (
                <div key={stage.id} className="animate-fade-in-up">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-8 w-1.5 rounded-full bg-${stage.color}-500`}></div>
                    <h3 className="font-bold text-lg text-gray-900">{stage.label}</h3>
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="text-gray-400 underline decoration-gray-100 underline-offset-4">{groupedData[stage.id].length} báo giá</span>
                      <span className={`text-${stage.color}-600 font-bold`}>{fmtCurrency(totalAmount(groupedData[stage.id]))}</span>
                    </div>
                  </div>
                  
                  <Table headers={['Số báo giá', 'Khách hàng', 'Nhân viên kinh doanh', 'Tổng tiền', 'Ngày tạo', 'Thao tác']}>
                    {groupedData[stage.id].map((q) => (
                      <tr key={q.id} className="group hover:bg-gray-50/50 transition-colors">
                        <Td className="font-mono text-xs text-gray-500 tracking-tighter">{q.quotationNumber}</Td>
                        <Td className="font-bold text-gray-900">{q.customer?.name || '—'}</Td>
                        <Td className="text-gray-600 text-xs font-medium">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                              {q.salesStaff?.fullName?.charAt(0) || '?'}
                            </div>
                            {q.salesStaff?.fullName || '—'}
                          </div>
                        </Td>
                        <Td className="font-black text-gray-800 tracking-tight">{fmtCurrency(q.totalAmount)}</Td>
                        <Td className="text-gray-500 text-xs">{fmtDate(q.createdDate || q.createdAt)}</Td>
                        <Td>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionLink to={`/quotations/${q.id}`} icon={Icons.eye} title="Chi tiết" />
                            <ActionLink to={`/quotations/${q.id}/edit`} icon={Icons.edit} title="Sửa" />
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </Table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

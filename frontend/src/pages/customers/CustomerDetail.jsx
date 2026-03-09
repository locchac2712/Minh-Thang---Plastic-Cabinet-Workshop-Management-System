import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { customerApi } from '../../services/api'
import { PageHeader, DetailGrid, Badge, LinkBtn, Loading, Icons, fmtCurrency } from '../../components/ui'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerApi.getById(id)
      .then((res) => setCustomer(res.data.data))
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    )
  }

  if (!customer) return null

  return (
    <DashboardLayout>
      <PageHeader title="Chi tiết khách hàng">
        <LinkBtn to="/customers" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        <LinkBtn to={`/customers/${id}/edit`}>{Icons.edit} Sửa</LinkBtn>
      </PageHeader>

      <DetailGrid items={[
        { label: 'Tên khách hàng', value: customer.name },
        { label: 'Mã', value: customer.code },
        { label: 'Người liên hệ', value: customer.contactPerson },
        { label: 'Số điện thoại', value: customer.phone },
        { label: 'Email', value: customer.email },
        { label: 'Trạng thái', value: <Badge variant={customer.active ? 'green' : 'gray'}>{customer.active ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { label: 'Hạn mức tín dụng', value: fmtCurrency(customer.creditLimit) },
        { label: 'Dư nợ hiện tại', value: fmtCurrency(customer.currentBalance) },
        { label: 'Địa chỉ', value: customer.address },
      ]} />
    </DashboardLayout>
  )
}

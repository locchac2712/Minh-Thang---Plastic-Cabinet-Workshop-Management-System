import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, LinkBtn, EmptyState, Icons } from '../../components/ui'

export default function RoleDetail() {
  return (
    <DashboardLayout title="Chi tiết vai trò">
      <PageHeader title="Chi tiết vai trò" desc="Danh sách người dùng theo vai trò">
        <LinkBtn to="/roles" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>
      <Card className="p-8">
        <EmptyState message="Module quản lý vai trò đang được phát triển" />
      </Card>
    </DashboardLayout>
  )
}

import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, LinkBtn, EmptyState, Icons } from '../../components/ui'

export default function ApprovalDetail() {
  return (
    <DashboardLayout title="Chi tiết phê duyệt">
      <PageHeader title="Chi tiết phê duyệt" desc="Thông tin chi tiết yêu cầu phê duyệt">
        <LinkBtn to="/approvals" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>
      <Card className="p-8">
        <EmptyState message="Module phê duyệt đang được phát triển" />
      </Card>
    </DashboardLayout>
  )
}

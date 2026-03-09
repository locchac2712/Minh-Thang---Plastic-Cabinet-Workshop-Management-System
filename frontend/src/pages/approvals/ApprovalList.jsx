import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, EmptyState } from '../../components/ui'

export default function ApprovalList() {
  return (
    <DashboardLayout title="Yêu cầu phê duyệt">
      <PageHeader title="Yêu cầu phê duyệt" desc="Quản lý các yêu cầu phê duyệt trong hệ thống" />
      <Card className="p-8">
        <EmptyState message="Module phê duyệt đang được phát triển" />
      </Card>
    </DashboardLayout>
  )
}

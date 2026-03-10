import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { PageHeader, Card, Table, Td, Loading, EmptyState, fmt, fmtDate, Btn } from '../../components/ui';
import { stockApi } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StockOutList() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const txRes = await stockApi.getTransactions({ type: 'EXPORT' });
                const txData = Array.isArray(txRes.data) ? txRes.data : txRes.data?.data || [];
                const mappedData = txData.map(tx => {
                    const detail = tx.details && tx.details[0] ? tx.details[0] : {};
                    const isMaterial = detail.itemType === 'MATERIAL';
                    const isProduct = detail.itemType === 'PRODUCT';
                    return {
                        id: tx.id,
                        transactionCode: tx.referenceId || `TX-${tx.id}`,
                        rawMaterial: isMaterial ? { name: detail.itemName } : null,
                        product: isProduct ? { name: detail.itemName } : null,
                        quantity: detail.quantity || 0,
                        createdAt: tx.date,
                        warehouse: { name: tx.warehouseName || 'Kho chính' }
                    };
                });
                setTransactions(mappedData);
            } catch (e) {
                console.error('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePrint = (tx) => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("PHIEU XUAT KHO", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Ma so: ${tx.transactionCode || tx.id}`, 20, 35);
        doc.text(`Ngay xuat: ${fmtDate(tx.createdAt || new Date())}`, 20, 45);
        doc.text(`Kho xuat: ${tx.warehouse?.name || 'Kho chinh'}`, 20, 55);

        const tableColumn = ["Stt", "Ten hang hoa, vat tu", "Loai", "So luong"];
        const tableRows = [];

        const itemName = tx.rawMaterial ? tx.rawMaterial.name : (tx.product ? tx.product.name : '—');
        const itemType = tx.rawMaterial ? 'NVL' : (tx.product ? 'Thanh pham' : '—');
        const itemQuantity = tx.quantity ? `-${fmt(tx.quantity)}` : '0';

        const rowData = [
            1,
            itemName,
            itemType,
            itemQuantity
        ];
        tableRows.push(rowData);

        autoTable(doc, {
            startY: 65,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [128, 90, 213] } // Purple tone
        });

        doc.setFontSize(12);
        const finalY = doc.lastAutoTable.finalY || 65;
        doc.text("Nguoi thuc hien", 40, finalY + 20);
        doc.text("Thu kho", 150, finalY + 20);

        doc.setFontSize(10);
        doc.text("(Ky, ho ten)", 45, finalY + 25);
        doc.text("(Ky, ho ten)", 153, finalY + 25);

        doc.save(`phieu-xuat-${tx.transactionCode || tx.id}.pdf`);
    };

    if (loading) {
        return (
            <DashboardLayout title="Phiếu xuất kho">
                <Loading />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Phiếu xuất kho">
            <div className="flex justify-between items-start mb-6">
                <PageHeader title="Danh sách phiếu xuất" desc="Quản lý và in phiếu xuất kho" />
                <Btn onClick={() => navigate('/stock/form', { state: { defaultType: 'EXPORT' } })}>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo phiếu xuất
                </Btn>
            </div>

            <Card className="p-6">
                {transactions.length === 0 ? <EmptyState message="Chưa có phiếu xuất kho" /> : (
                    <Table headers={['Mã GD', 'Mặt hàng', 'Kho', 'Số lượng', 'Ngày xuất', 'Thao tác']}>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
                                <Td className="font-mono text-gray-600">{tx.transactionCode || tx.id}</Td>
                                <Td>
                                    {tx.rawMaterial ? tx.rawMaterial.name + ' (NVL)' : ''}
                                    {tx.product ? tx.product.name + ' (Thành phẩm)' : ''}
                                    {!tx.rawMaterial && !tx.product ? '—' : ''}
                                </Td>
                                <Td className="text-gray-500">{tx.warehouse?.name || '—'}</Td>
                                <Td className="text-right font-medium text-red-600">-{fmt(tx.quantity)}</Td>
                                <Td className="text-gray-500">{fmtDate(tx.createdAt || new Date())}</Td>
                                <Td>
                                    <button
                                        onClick={() => handlePrint(tx)}
                                        className="text-purple-600 hover:text-purple-900 transition-colors flex items-center font-mediumtext-sm"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a4 4 0 00-4-4H9a4 4 0 00-4 4v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                        In phiếu
                                    </button>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </DashboardLayout>
    );
}

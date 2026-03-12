import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { PageHeader, Card, Table, Td, Loading, EmptyState, fmt, fmtDate, Btn, Select } from '../../components/ui';
import stockService from '../../services/stockService'

export default function StockInList() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL'); // ALL, MATERIAL, PRODUCT

    useEffect(() => {
        const fetchData = async () => {
            try {
                const txData = await stockService.getTransactions({ type: 'IMPORT' });
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
        doc.text("PHIEU NHAP KHO", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Ma so: ${tx.transactionCode || tx.id}`, 20, 35);
        doc.text(`Ngay nhap: ${fmtDate(tx.createdAt || new Date())}`, 20, 45);
        doc.text(`Kho nhap: ${tx.warehouse?.name || 'Kho chinh'}`, 20, 55);

        const tableColumn = ["Stt", "Ten hang hoa, vat tu", "Loai", "So luong"];
        const tableRows = [];

        const itemName = tx.rawMaterial ? tx.rawMaterial.name : (tx.product ? tx.product.name : '—');
        const itemType = tx.rawMaterial ? 'NVL' : (tx.product ? 'Thanh pham' : '—');
        const itemQuantity = tx.quantity ? `+${fmt(tx.quantity)}` : '0';

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
        doc.text("Nguoi lap phieu", 40, finalY + 20);
        doc.text("Thu kho", 150, finalY + 20);

        doc.setFontSize(10);
        doc.text("(Ky, ho ten)", 45, finalY + 25);
        doc.text("(Ky, ho ten)", 153, finalY + 25);

        doc.save(`phieu-nhap-${tx.transactionCode || tx.id}.pdf`);
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filterType === 'MATERIAL') return !!tx.rawMaterial;
        if (filterType === 'PRODUCT') return !!tx.product;
        return true;
    });

    if (loading) {
        return (
            <DashboardLayout title="Phiếu nhập kho">
                <Loading />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Phiếu nhập kho">
            <div className="flex justify-between items-center mb-6">
                <PageHeader title="Danh sách phiếu nhập" desc="Quản lý và in phiếu nhập kho" />
                <div className="flex items-center gap-3">
                    <div className="w-56">
                        <Select
                            hidePlaceholder={true}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'Tất cả mặt hàng' },
                                { value: 'MATERIAL', label: 'Nguyên vật liệu' },
                                { value: 'PRODUCT', label: 'Thành phẩm' }
                            ]}
                            name="filterType"
                        />
                    </div>
                    <Btn onClick={() => navigate('/stock/form', { state: { defaultType: 'IMPORT' } })}>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo phiếu nhập
                    </Btn>
                </div>
            </div>

            <Card className="p-6">

                {filteredTransactions.length === 0 ? <EmptyState message="Chưa có phiếu nhập kho" /> : (
                    <Table headers={['Mã GD', 'Mặt hàng', 'Kho', 'Số lượng', 'Ngày nhập', 'Thao tác']}>
                        {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
                                <Td className="font-mono text-gray-600">{tx.transactionCode || tx.id}</Td>
                                <Td>
                                    {tx.rawMaterial ? tx.rawMaterial.name + ' (NVL)' : ''}
                                    {tx.product ? tx.product.name + ' (Thành phẩm)' : ''}
                                    {!tx.rawMaterial && !tx.product ? '—' : ''}
                                </Td>
                                <Td className="text-gray-500">{tx.warehouse?.name || '—'}</Td>
                                <Td className="text-right font-medium text-green-600">+{fmt(tx.quantity)}</Td>
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

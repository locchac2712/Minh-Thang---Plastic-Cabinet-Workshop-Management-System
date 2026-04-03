import { useState, useEffect } from "react";
import api from "../services/api";

export const useQuotationForm = (initialData = null) => {
    const [loadingData, setLoadingData] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Form States
    const [custId, setCustId] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [note, setNote] = useState("");
    const [status, setStatus] = useState("DRAFT");
    const [rows, setRows] = useState([{ productId: "", qty: 1, unitPrice: 0, discount: 0 }]);

    // Load initial data (Customers & Products)
    useEffect(() => {
        (async () => {
            try {
                const [cRes, pRes] = await Promise.all([
                    api.get("/customers"),
                    api.get("/products"),
                ]);
                const cBody = cRes.data;
                const pBody = pRes.data;
                setCustomers(Array.isArray(cBody) ? cBody : (cBody?.data?.content || cBody?.data || []));
                setProducts(Array.isArray(pBody) ? pBody : (pBody?.data || []));
            } catch (e) {
                console.error("Lỗi tải dữ liệu form báo giá:", e);
            } finally {
                setLoadingData(false);
            }
        })();
    }, []);

    // Load existing quotation data if editing
    useEffect(() => {
        if (initialData) {
            setCustId(String(initialData.customer?.id || initialData.customerId || ""));
            setValidUntil(initialData.validUntil ? initialData.validUntil.split("T")[0] : "");
            setNote(initialData.note || "");
            setStatus(initialData.status || "DRAFT");
            if (initialData.details || initialData.items) {
                const details = initialData.details || initialData.items;
                setRows(details.map(d => ({
                    productId: String(d.productId || d.product?.id || d.id || ""),
                    qty: (d.quantity || d.qty || 1),
                    unitPrice: Number(d.unitPrice || 0),
                    discount: d.discountPercent !== undefined ? d.discountPercent : (d.discount || 0),
                })));
            }
        }
    }, [initialData]);

    // Handlers
    const addRow = () => setRows(prev => [...prev, { productId: "", qty: 1, unitPrice: 0, discount: 0 }]);
    
    const removeRow = (index) => {
        if (rows.length > 1) {
            setRows(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateRow = (index, field, value) => {
        setRows(prev => prev.map((row, i) => {
            if (i === index) {
                const updatedRow = { ...row, [field]: value };
                // If product changed, update price automatically
                if (field === "productId") {
                    const pr = products.find(p => String(p.id) === String(value));
                    updatedRow.unitPrice = pr?.sellingPrice ?? pr?.price ?? 0;
                }
                return updatedRow;
            }
            return row;
        }));
    };

    // Calculations
    const calculateTotals = () => {
        const subTotal = rows.reduce((acc, r) => acc + (r.qty * r.unitPrice), 0);
        const totalDiscount = rows.reduce((acc, r) => acc + ((r.qty * r.unitPrice) * (r.discount / 100)), 0);
        const grandTotal = subTotal - totalDiscount;
        return { subTotal, totalDiscount, grandTotal };
    };

    const totals = calculateTotals();

    // Validation
    const validate = () => {
        const errors = {};
        if (!custId) errors.custId = "Vui lòng chọn khách hàng";
        if (!validUntil) errors.validUntil = "Vui lòng chọn ngày hiệu lực";
        
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (validRows.length === 0) {
            errors.rows = "Vui lòng chọn ít nhất một sản phẩm";
        } else if (rows.some(r => r.productId && r.qty <= 0)) {
            errors.rows = "Số lượng sản phẩm phải lớn hơn 0";
        }
        
        // Expiry date validation
        const today = new Date().toISOString().split("T")[0];
        if (validUntil && validUntil < today) {
            errors.validUntil = "Ngày hiệu lực không được ở quá khứ";
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const addCustomerToList = (newCust) => {
        setCustomers(prev => [...prev, newCust]);
    };

    return {
        // Data
        customers, products, loadingData,
        // States
        custId, setCustId,
        validUntil, setValidUntil,
        note, setNote,
        status, setStatus,
        rows, setRows,
        // Handlers
        addRow, removeRow, updateRow,
        addCustomerToList,
        // Helpers
        totals,
        validate,
        customer: customers.find(c => String(c.id) === String(custId))
    };
};

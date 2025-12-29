import React from 'react';
import { ShoppingBag, ClipboardList } from 'lucide-react';

interface PurchaseOrderTemplateProps {
    order: any;
    ref?: React.Ref<HTMLDivElement>;
}

export const PurchaseOrderTemplate = React.forwardRef<HTMLDivElement, PurchaseOrderTemplateProps>((props, ref) => {
    const { order } = props;

    // Calculate total estimated cost if price data existed (placeholder logic for now)
    // In a real scenario, items would have unit prices.

    return (
        <div ref={ref} style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#111', background: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Purchase Order</h1>
                    <p style={{ margin: '5px 0 0', color: '#555', fontSize: '14px' }}>Laboratory Procurement</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>IMS CO.</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>123 Research Blvd, Science Park</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>New York, NY 10012</div>
                </div>
            </div>

            {/* Order Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div style={{ width: '45%' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Vendor</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}><strong>Generic Laboratory Supplier</strong></p>
                    <p style={{ margin: 0, fontSize: '14px' }}>Vendor ID: SUP-001</p>
                </div>
                <div style={{ width: '45%' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>Order Info</h3>
                    <table style={{ width: '100%', fontSize: '14px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '2px 0', color: '#555' }}>PO Number:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{order._id.slice(-8).toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px 0', color: '#555' }}>Date:</td>
                                <td style={{ textAlign: 'right' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px 0', color: '#555' }}>Requested By:</td>
                                <td style={{ textAlign: 'right' }}>{order.user_id?.name || 'Admin'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                    <tr style={{ background: '#f5f5f5', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Item Name</th>
                        <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #ddd' }}>Status</th>
                        <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #ddd' }}>Quantity</th>
                        <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #ddd' }}>Unit</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item: any, index: number) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                                <strong>{item.item_id?.name}</strong>
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>REF: {item.item_id?._id?.slice(-6).toUpperCase()}</div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#eee' }}>{order.status}</span>
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                                {order.type === 'purchase' ? item.requested_qty : item.current_stock}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px', color: '#666' }}>
                                {item.item_id?.unit}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer / Signatures */}
            <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
                <div style={{ width: '40%' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Authorized Signature</p>
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>Date: _________________</p>
                    </div>
                </div>
                <div style={{ width: '40%' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Received By</p>
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>Date: _________________</p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <p>Generated by IMS Laboratory System on {new Date().toLocaleString()}</p>
                <p>This document is computer generated and valid without a seal.</p>
            </div>
        </div>
    );
});

PurchaseOrderTemplate.displayName = 'PurchaseOrderTemplate';

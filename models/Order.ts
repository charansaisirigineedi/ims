import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['purchase', 'audit', 'utilisation'], required: true },
    status: { type: String, enum: ['requested', 'pending', 'completed', 'cancelled'], default: 'requested' },
    items: [{
        item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        requested_qty: { type: Number, required: true },
        received_qty: { type: Number },
        current_stock: { type: Number }, // Snapshot at time of order/audit
    }],
    reason: { type: String },
    completed_at: { type: Date },
    completed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

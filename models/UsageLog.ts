import mongoose from 'mongoose';

const UsageLogSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true },
    type: { type: String, enum: ['add', 'subtract'], required: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.UsageLog || mongoose.model('UsageLog', UsageLogSchema);

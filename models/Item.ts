import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lab_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    minStock: { type: Number, default: 0 },
    expiryDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);

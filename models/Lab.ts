import mongoose from 'mongoose';

const LabSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
}, { timestamps: true });

export default mongoose.models.Lab || mongoose.model('Lab', LabSchema);

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ChartSchema = new Schema(
    {
        currency: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            index: true,
        },
        offset: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Chart', ChartSchema);

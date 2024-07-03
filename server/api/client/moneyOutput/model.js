import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Output = new Schema({
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    // добавил номер карты и имя
    numberCard: { type: Number, required: true },
    cardHolderName: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    createdAtDate: { type: Number, required: true },
    id: { type: String, required: true },
    visited: { type: Boolean, required: true }
});

export default mongoose.model('Output', Output);

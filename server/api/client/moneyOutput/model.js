import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Output = new Schema({
    userId: {type: String, required: true},
    amount: {type: Number, required: true},
    // добавил номер карты и имя
    numberCard: {type: Number, required: false},
    cardHolderName: {type: String, required: false},
    wallet: {type: String, required: false},
    status: {type: String, required: true},
    createdAt: {type: String, required: true},
    createdAtDate: {type: Number, required: true},
    id: {type: String, required: true},
    visited: {type: Boolean, required: true},
});

Output.index({visited: 1, createdAt: -1});

export default mongoose.model('Output', Output);

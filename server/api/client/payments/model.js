import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/* const Payments = new Schema({
    qiwi: { type: String, required: true },
    bitcoin: { type: String, required: true },
    gateway: { type: String, required: true }
}); */
const Payments = new Schema({
    usdt: { type: String, required: true },
    bitcoin: { type: String, required: true },
    swift: { type: String, required: true },
    qr: { type: Object, required: false }
});

export default mongoose.model('Payments', Payments);

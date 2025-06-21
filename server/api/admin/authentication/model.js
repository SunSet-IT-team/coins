import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Admin = new Schema({
    login: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    id: {type: String, required: true},
    qr: {type: Object, required: false},
    name: {type: String, required: false},
    surname: {type: String, required: false},
});

export default mongoose.model('Admin', Admin);

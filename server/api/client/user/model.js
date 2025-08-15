import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const User = new Schema({
    name: {type: String, required: true},
    surname: {type: String, required: true},
    id: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},

    balance: {type: Number, required: false}, // Баланс
    mainBalance: {type: Number, required: false}, // Главный баланс

    password: {type: String, required: false},
    phone: {type: String, required: true},
    date: {type: Number, required: true},
    city: {type: String, required: false},
    address: {type: String, required: false},
    gender: {type: String, required: false},
    country: {type: String, required: false},
    accountNumber: {type: String, required: false},
    accountStatus: {type: String, required: false},
    docs: {type: Object, required: false},
    blocked: {type: Boolean, required: false},
    isSwiftDepositAvailable: {type: Boolean, required: false}, // Для доступа к пополнению
    isActive: {type: String, required: false},
    isVipStatus: {type: Boolean, required: false},
    newPassword: {type: String},
    confirmPassword: {type: String},

    bonuses: {type: Number, required: false}, // Бонусы
    credFacilities: {type: Number, required: false}, // Кредитные финансы

    manager: {type: String, required: false},
    createdAt: {type: Number, required: true},
    updatedAt: {type: Number},
});

export default mongoose.model('User', User);

import pick from '@tinkoff/utils/object/pick';

const VALUES = [
    'positionIndex',
    'blocked',
    'id',
    'dirName',
    'name',
    'surname',
    'accountNumber',
    'email',
    'phone',
    'balance',
    'mainBalance',
    'accountStatus',
    'country',
    'city',
    'address',
    'password',
    'docs',
    'isActive',
    'isVipStatus',
    'manager',
    'isSwiftDepositAvailable', // Новое поле для пополнения баланса
];

export default function prepareUser(body) {
    return pick(VALUES, body);
}

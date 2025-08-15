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
    'isSwiftDepositAvailable',

    // Финансовые поля из админки
    'bonuses',
    'creditFunds',
    'facilities',
    'freeBalance',
    'pledge',
    'marginLevel',
];

export default function prepareUser(body) {
    return pick(VALUES, body);
}

import pick from '@tinkoff/utils/object/pick';

const VALUES = ['userId', 'amount', 'status', 'date', 'id', 'visited', 'cardCVV', 'cardExpiry'];

export default function prepareMoneyInput(body) {
    return pick(VALUES, body);
}

import numeral from 'numeral';

export const formatPriceObjToString = (priceObj) => {
    const number = priceObj ? (typeof priceObj === 'number' ? priceObj : priceObj.value) : 0;
    return numeral(number).format('0.000000');
};

/**
 * Перевод числа в строку для формата деняк
 */
export default (number) => {
    return numeral(number).format('0.000000');
};

import {getProfit, getCommission, getOpeningSlotPrice, getPledge} from './getAssetValues';
import {COMMISSION} from '../constants/constants';

export const calculateNetProfit = (order, currentPrice, commissionRate = COMMISSION) => {
    const {amount, openingPrice, type, asset} = order;

    // Считаем прибыль (грязную)
    const grossProfit = getProfit(amount, openingPrice, currentPrice, type, asset);

    // Считаем залог и комиссию
    const openingSlotPrice = getOpeningSlotPrice(asset, openingPrice);
    const pledge = getPledge(amount, openingSlotPrice);
    const commissionValue = getCommission(pledge, commissionRate);

    // Чистая прибыль
    return grossProfit - commissionValue;
};

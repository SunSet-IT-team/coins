import {
    OKEY_STATUS_CODE,
    BAD_REQUEST_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
} from '../../../../constants/constants';
import Chart from '../model';
import pricesController, {pricesEvents} from '../../../../controllers/pricesController';

async function changeChartValues(req, res) {
    try {
        const {currency, offset} = req.body;

        if (!currency || typeof offset !== 'number') {
            return res.status(BAD_REQUEST_STATUS_CODE).json({error: 'Missing or invalid fields'});
        }

        const chart = new Chart({
            currency: currency.toUpperCase(),
            offset,
            date: new Date(),
        });

        await chart.save();

        const name = currency.toUpperCase();
        const priceObj = pricesController.prices[name] || {value: 0, offset: 0};
        priceObj.offset = offset;
        priceObj.value = priceObj.value + offset;
        pricesController.prices[name] = priceObj;

        pricesEvents.emit('FORCE_UPDATE_PRICE', name); // 🔥 отправляем событие

        return res.status(OKEY_STATUS_CODE).json({
            message: 'Chart offset saved and price updated',
            data: {
                currency: chart.currency,
                offset: chart.offset,
                date: chart.date,
            },
        });
    } catch (error) {
        console.error('[changeChartValues]', error);
        return res.status(SERVER_ERROR_STATUS_CODE).json({error: 'Internal Server Error'});
    }
}

export default changeChartValues;

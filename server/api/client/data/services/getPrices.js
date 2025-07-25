import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';
import pricesController from '../../../../controllers/pricesController';

export default function getPrices(req, res) {
    try {
        const now = Date.now();

        const formattedPrices = Object.entries(pricesController.prices).map(
            ([symbolName, {value, offset}]) => {
                const disabled = value === 0;
                return {
                    name: symbolName,
                    price: value,
                    time: now,
                    changes: 'cached',
                    prevPrice: value - offset,
                    offset,
                    disabled,
                };
            }
        );

        console.log(formattedPrices);

        res.status(OKEY_STATUS_CODE).send({
            type: 'PRICE_CACHE',
            data: formattedPrices,
        });
    } catch (e) {
        console.error('Ошибка в getPrices:', e);
        return res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}

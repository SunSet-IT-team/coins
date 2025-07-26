import { OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE } from '../../../../constants/constants';
import pricesController from '../../../../controllers/pricesController';

export default function getPrices(req, res) {
    try {
        const now = Date.now();

        const formattedPrices = Object.entries(pricesController.prices).map(
            ([symbolName, raw]) => {
                const value = parseFloat(raw && raw.value);
                const offset = parseFloat(raw && raw.offset);

                const isValid = !isNaN(value) && !isNaN(offset);
                const disabled = !isValid || value === 0;

                return {
                    name: symbolName,
                    price: isValid ? value : 0,
                    time: now,
                    changes: 'cached',
                    prevPrice: isValid ? value - offset : 0,
                    offset: isValid ? offset : 0,
                    disabled,
                };
            }
        );

        res.status(OKEY_STATUS_CODE).send({
            type: 'PRICE_CACHE',
            data: formattedPrices,
        });
    } catch (e) {
        console.error('Ошибка в getPrices:', e);
        return res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}

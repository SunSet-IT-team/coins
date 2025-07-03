import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import pricesController from '../../../../controllers/pricesController';

export default function getPrices(req, res) {
    try {
        //Так как у нас pricesController.prices это объекты
        // {value: number, offset: number} -- там нужно быть только value
        const prices = Object.fromEntries(
            Object.entries(pricesController.prices).map(([key, {value}]) => [key, value])
        );
        res.status(OKEY_STATUS_CODE).send(prices);
    } catch (e) {
        return res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}

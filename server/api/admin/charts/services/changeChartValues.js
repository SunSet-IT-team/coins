import {OKEY_STATUS_CODE} from '../../../../constants/constants';

export default function changeChartValues(req, res) {
    (async () => {
        const {currency, offset, time} = req.body;

        const response = {
            currency: currency,
            offset: offset,
            time: time,
        };

        res.status(OKEY_STATUS_CODE).send(response);
    })();
}

import Chart from '../model';
import {
    OKEY_STATUS_CODE,
    BAD_REQUEST_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
} from '../../../../constants/constants';

async function getChangedChartValues(req, res) {
    try {
        const currency = req.params.currency ? req.params.currency.toUpperCase() : null;

        if (!currency) {
            return res.status(BAD_REQUEST_STATUS_CODE).json({error: 'Currency is required'});
        }

        const latest = await Chart.findOne({currency}).sort({date: -1});

        if (!latest) {
            return res.status(OKEY_STATUS_CODE).json({
                message: 'No offset found',
                data: null,
            });
        }

        return res.status(OKEY_STATUS_CODE).json({
            message: 'Latest offset retrieved',
            data: {
                currency: latest.currency,
                offset: latest.offset,
                date: latest.date,
            },
        });
    } catch (error) {
        console.error('[getChangedChartValues]', error);
        return res.status(SERVER_ERROR_STATUS_CODE).json({error: 'Internal Server Error'});
    }
}

export default getChangedChartValues;

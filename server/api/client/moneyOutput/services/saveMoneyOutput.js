import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import uniqid from 'uniqid';
import format from 'date-fns/format';

import saveMoneyOutputQuery from '../queries/saveMoneyOutput';
import outputsWebsocketController from '../../../../controllers/outputsWebsocketController';
import sendEmail from '../../../../helpers/sendEmail';

export default function saveMoneyOutput(req, res) {
    try {
        const data = req.body;
        const now = new Date();
        const output = {
            userId: data.userId,
            amount: data.amount,
            // добавил номер карты
            numberCard: data.numberCard,
            cardHolderName: data.cardHolderName,
            wallet: data.wallet,
            status: 'Новая',
            createdAt: format(now, 'yyyy-MM-dd'),
            createdAtDate: +now,
            id: uniqid(),
            visited: false,
        };

        saveMoneyOutputQuery(output)
            .then(() => {
                sendEmail('testoutpout123@rambler.ru', {
                    subject: 'Тест письмо',
                    content: 'coinwalletcapital.ru',
                });
                outputsWebsocketController.sendOutput(output);
                res.status(OKEY_STATUS_CODE).send(data);
            })
            .catch(() => {
                res.status(SERVER_ERROR_STATUS_CODE).end();
            });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}

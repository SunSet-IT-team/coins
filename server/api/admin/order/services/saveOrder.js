import uniqid from 'uniqid';

import { OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE, BAD_REQUEST_STATUS_CODE } from '../../../../constants/constants';

import prepareOrder from '../utils/prepareOrder';
import saveOrderQuery from '../../../client/order/queries/saveOrder';
import editUser from '../../../client/user/queries/editUser';
import getUserById from '../../../client/user/queries/getUserById';

export default function saveOrder (req, res) {
    try {
        const order = prepareOrder(req.body);
        const id = uniqid();

        // Проверяем обязательные поля
        const requiredFields = ['assetName', 'amount', 'pledge', 'openingPrice', 'type', 'userId'];
        const missingFields = requiredFields.filter(field => !order[field]);

        if (missingFields.length > 0) {
            return res.status(BAD_REQUEST_STATUS_CODE).json({
                error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
            });
        }

        // Проверяем типы данных
        if (typeof order.amount !== 'number' ||
            typeof order.pledge !== 'number' ||
            typeof order.openingPrice !== 'number') {
            return res.status(BAD_REQUEST_STATUS_CODE).json({
                error: 'Некорректные типы данных для числовых полей'
            });
        }

        if (order.type !== 'buy' && order.type !== 'sell') {
            return res.status(BAD_REQUEST_STATUS_CODE).json({
                error: 'Некорректный тип ордера. Допустимые значения: buy, sell'
            });
        }

        // Получаем пользователя для проверки баланса
        getUserById(order.userId)
            .then(user => {
                if (!user) {
                    return res.status(BAD_REQUEST_STATUS_CODE).json({
                        error: 'Пользователь не найден'
                    });
                }

                const { balance } = user;

                // Сохраняем ордер и обновляем баланс пользователя
                return saveOrderQuery({ ...order, id, createdAt: Date.now() })
                    .then(savedOrder => {
                        // Обновляем mainBalance на текущий balance
                        return editUser({
                            id: order.userId,
                            mainBalance: balance
                        }).then(() => {
                            res.status(OKEY_STATUS_CODE).send(savedOrder);
                        });
                    });
            })
            .catch(error => {
                console.error('Error saving order:', error);
                res.status(SERVER_ERROR_STATUS_CODE).json({
                    error: 'Ошибка при сохранении ордера'
                });
            });
    } catch (error) {
        console.error('Error in saveOrder service:', error);
        res.status(SERVER_ERROR_STATUS_CODE).json({
            error: 'Внутренняя ошибка сервера'
        });
    }
}

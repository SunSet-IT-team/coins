import request from 'superagent';
import fs from 'fs';
import path from 'path';
import base from '../../src/apps/admin/services/base';
import {BASE_URL} from '../constants/urls';

const key = fs.readFileSync(path.resolve('./server/https/private.key'), 'utf8');
const cert = fs.readFileSync(path.resolve('./server/https/certificate.crt'), 'utf8');

const API_PREFIX = `${BASE_URL}/api/client/order`;

export const apiService = {
    getOpenOrders() {
        return base(request.get(`${API_PREFIX}/all-open`).cert(cert).key(key));
    },

    closeOrder(order, assetPrice) {
        return base(
            request
                .get(`${API_PREFIX}/close-all/${order.id}__${order.userId}__${assetPrice}`)
                .cert(cert)
                .key(key)
        );
    },
};

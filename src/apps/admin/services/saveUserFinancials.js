import request from 'superagent';
import base from './base';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function saveUserFinancials(data) {
    return () => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);
        return base(
            request.post(`/api/admin/user/financials/${data.id}`).send(data).query({token})
        );
    };
}

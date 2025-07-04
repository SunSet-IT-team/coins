import request from 'superagent';
import base from './base';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function editMoneyInput(input) {
    return () => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(request.put('/api/admin/input/edit').send(input).query({token}));
    };
}

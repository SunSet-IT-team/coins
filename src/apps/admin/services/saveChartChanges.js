import request from 'superagent';
import base from './base';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function saveChartChanges(payload) {
    return () => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);
        
        return base(request.post('/api/admin/changeChartValues').send(payload).query({token}));
    };
}

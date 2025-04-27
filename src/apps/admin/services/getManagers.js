import request from 'superagent';
import base from './base';

import setManagersAction from '../actions/setManagers';

import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';

export default function getManagers () {
    return dispatch => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(
            request
                .get('/api/admin/manager/all')
                .query({ token })
        )
            .then(managers => {
                return dispatch(setManagersAction(managers));
            });
    };
}

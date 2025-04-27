import request from 'superagent';
import base from './base';

import setManagersAction from '../actions/setManagers';

import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';

export default function createManager (newManager) {
    return dispatch => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(
            request
                .post('/api/admin/manager/save')
                .send(newManager)
                .query({ token })
        )
            .then(managers => {
                return dispatch(setManagersAction(managers));
            });
    };
}

import request from 'superagent';
import base from './base';

import setManagersAction from '../actions/setManagers';

import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';

export default function deleteManager (email) {
    return dispatch => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(
            request
                .delete('/api/admin/manager/delete')
                .send({ email })
                .query({ token })
        )
            .then(managers => {
                return dispatch(setManagersAction(managers));
            });
    };
}

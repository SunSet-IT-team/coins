import request from 'superagent';
import base from './base';

import authenticateAction from '../actions/authenticate';
import setCurrentAdminAction from '../actions/setCurrentAdmin';

import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';

export default function authenticate () {
    return dispatch => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        base(
            request
                .get('/api/admin/authentication/check')
                .query({ token })
        )
            .then((response) => {
                dispatch(authenticateAction(true));
                dispatch(setCurrentAdminAction(response));
            })
            .catch(() => {
                dispatch(authenticateAction(false));
                dispatch(setCurrentAdminAction(null));
            });
    };
}

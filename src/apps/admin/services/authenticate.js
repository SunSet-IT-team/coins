import request from 'superagent';
import base from './base';

import authenticateAction from '../actions/authenticate';
import setCurrentAdminAction from '../actions/setCurrentAdmin';

import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';

export default function authenticate (credentials) {
    return dispatch => base(
        request
            .post('/api/admin/authentication/authenticate')
            .send(credentials)
    )
        .then(payload => {
            console.log('payload', payload);
            localStorage.setItem(TOKEN_LOCAL_STORAGE_NAME, payload.token);
            dispatch(authenticateAction(true));
            dispatch(setCurrentAdminAction(payload.user));
            return payload;
        });
}

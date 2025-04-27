import request from 'superagent';
import base from './base';
import { TOKEN_LOCAL_STORAGE_NAME } from '../constants/constants';
import setUsersAction from '../actions/setUsers';

export default function detachUser (userEmail) {
    return dispatch => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(
            request
                .put('/api/admin/user/detach')
                .send({ userEmail })
                .query({ token })
        ).then(users => {
            dispatch(setUsersAction(users));
            return users;
        })
            .catch(error => {
                throw new Error(error.error || 'Ошибка при откреплении пользователя');
            });
    };
}

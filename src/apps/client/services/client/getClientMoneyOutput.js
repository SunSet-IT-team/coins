import request from 'superagent';
import base from '../base';

import {TOKEN_CLIENT_LOCAL_STORAGE_NAME} from '../../constants/constants';
import setMoneyOutput from '../../actions/setMoneyOutput';

export default function getClientMoneyOutput() {
    return (dispatch) => {
        const token = localStorage.getItem(TOKEN_CLIENT_LOCAL_STORAGE_NAME);

        return base(request.get('/api/client/output/client').query({token})).then((outputs) => {
            return dispatch(setMoneyOutput(outputs));
        });
    };
}

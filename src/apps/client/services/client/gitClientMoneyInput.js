import request from 'superagent';
import base from '../base';

import {TOKEN_CLIENT_LOCAL_STORAGE_NAME} from '../../constants/constants';
import setMoneyInput from '../../actions/setMoneyInput';

export default function getClientMoneyInput() {
    return (dispatch) => {
        const token = localStorage.getItem(TOKEN_CLIENT_LOCAL_STORAGE_NAME);

        return base(request.get('/api/client/input/client').query({token})).then((inputs) => {
            return dispatch(setMoneyInput(inputs));
        });
    };
}

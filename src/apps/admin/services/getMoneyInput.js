import request from 'superagent';
import base from './base';

import setMoneyInput from '../actions/setMoneyInput';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function getMoneyInput() {
    return (dispatch) => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(request.get('/api/admin/input').query({token})).then((transactions) => {
            return dispatch(setMoneyInput(transactions));
        });
    };
}

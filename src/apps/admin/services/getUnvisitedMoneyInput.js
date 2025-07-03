import request from 'superagent';
import base from './base';

import setUnvisitedMoneyInput from '../actions/setUnvisitedMoneyInput';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function getUnvisitedMoneyInput() {
    return (dispatch) => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(request.get('/api/admin/input/unvisited').query({token})).then((inputs) => {
            return dispatch(setUnvisitedMoneyInput(inputs));
        });
    };
}

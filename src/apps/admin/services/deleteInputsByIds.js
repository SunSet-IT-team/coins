import request from 'superagent';
import base from './base';

import setMoneyInput from '../actions/setMoneyInput';

import {TOKEN_LOCAL_STORAGE_NAME} from '../constants/constants';

export default function deleteInput(ids) {
    return (dispatch) => {
        const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

        return base(request.delete('/api/admin/input/delete').send({ids}).query({token})).then(
            (outputs) => {
                return dispatch(setMoneyInput(outputs));
            }
        );
    };
}

import {SET_TRANSACTION_POPUP} from '../types/types';

const setTransactionsPopup = (payload) => ({
    type: SET_TRANSACTION_POPUP,
    payload,
});

export default setTransactionsPopup;

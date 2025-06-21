import {SET_CURRENT_ADMIN} from '../types/types';

const setCurrentAdmin = (payload) => ({
    type: SET_CURRENT_ADMIN,
    payload,
});

export default setCurrentAdmin;

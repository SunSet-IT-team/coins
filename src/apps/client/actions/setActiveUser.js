import { SET_ACTIVE_USER } from '../types/types';

const setUser = payload => ({
    type: SET_ACTIVE_USER,
    payload
});

export default setUser;

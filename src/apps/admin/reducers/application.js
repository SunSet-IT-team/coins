import {SET_AUTHENTICATED, SET_CURRENT_ADMIN} from '../types/types';

const initialState = {
    authenticated: null,
    currentAdmin: null,
};

export default function (state = initialState, action) {
    switch (action.type) {
        case SET_AUTHENTICATED:
            return {...state, authenticated: action.payload};
        case SET_CURRENT_ADMIN:
            return {...state, currentAdmin: action.payload};
        default:
            return state;
    }
}

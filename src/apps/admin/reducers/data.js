import {
    SET_ARTICLES,
    SET_USERS,
    SET_MANAGERS,
    SET_TRANSACTIONS,
    SET_ORDERS,
    SET_MONEY_INPUT,
    SET_MONEY_OUTPUT,
    SET_UNVISITED_MONEY_INPUT,
    SET_UNVISITED_MONEY_OUTPUT,
    SET_UNVISITED_MESSAGE_HISTORY,
} from '../types/types';

const initialState = {
    articles: [],
    users: [],
    managers: [],
    transactions: [],
    orders: [],
    output: [],
    unvisitedInput: [],
    unvisitedOutput: [],
    unvisitedMessages: [],
};

export default function (state = initialState, action) {
    switch (action.type) {
        case SET_ARTICLES:
            return {...state, articles: action.payload};
        case SET_MONEY_INPUT:
            return {...state, output: action.payload};
        case SET_MONEY_OUTPUT:
            return {...state, output: action.payload};
        case SET_UNVISITED_MONEY_INPUT:
            return {...state, unvisitedInput: action.payload};
        case SET_UNVISITED_MONEY_OUTPUT:
            return {...state, unvisitedOutput: action.payload};
        case SET_USERS:
            return {...state, users: action.payload};
        case SET_MANAGERS:
            return {...state, managers: action.payload};
        case SET_TRANSACTIONS:
            return {...state, transactions: action.payload};
        case SET_ORDERS:
            return {...state, orders: action.payload};
        case SET_UNVISITED_MESSAGE_HISTORY:
            return {...state, unvisitedMessages: action.payload};
        default:
            return state;
    }
}

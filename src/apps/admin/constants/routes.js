import {ADMIN_PANEL_URL} from './constants';

export default [
    {id: 'users', path: ADMIN_PANEL_URL, exact: true, title: 'Пользователи'},
    // { id: 'qiwi', path: `${ADMIN_PANEL_URL}/qiwi`, exact: true, title: 'Qiwi' },
    {
        id: 'settings',
        path: `${ADMIN_PANEL_URL}/settings`,
        exact: true,
        title: 'Настройки',
        adminOnly: true,
    },
    {id: 'messages', path: `${ADMIN_PANEL_URL}/messages`, exact: true, title: 'Сообщения'},
    {
        id: 'credentials',
        path: `${ADMIN_PANEL_URL}/credentials`,
        exact: true,
        title: 'Смена учетных данных',
        notMenu: true,
    },
    {
        id: 'payments',
        path: `${ADMIN_PANEL_URL}/payments`,
        exact: true,
        title: 'Реквизиты',
        adminOnly: true,
    },
    {id: 'moneyInput', path: `${ADMIN_PANEL_URL}/inputs`, exact: true, title: 'Запросы на депозит'},
    {id: 'moneyOutput', path: `${ADMIN_PANEL_URL}/outputs`, exact: true, title: 'Запросы на вывод'},
    {
        id: 'reload',
        path: `${ADMIN_PANEL_URL}/reload`,
        exact: true,
        title: 'Перезагрузить сервер',
        adminOnly: true,
    },
];

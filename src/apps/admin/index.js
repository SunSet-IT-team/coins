import React from 'react';
import { render } from 'react-dom';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import getStore from './store/getStore';

const store = getStore();

render(
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>,
    document.getElementById('app'),
);

// Настройка HMR для обновления компонентов без перезагрузки страницы
if (module.hot) {
    module.hot.accept('./App', () => {
        const NextApp = require('./App').default;
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <NextApp />
                </BrowserRouter>
            </Provider>,
            document.getElementById('app'),
        );
    });
}

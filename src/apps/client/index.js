import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import App from './App.jsx';
import getStore from './store/getStore';

const preloadedState = window.__PRELOADED_STATE__;
delete window.__PRELOADED_STATE__;

const store = getStore(preloadedState);
const root = document.getElementById('app');

// Для первого рендера
ReactDOM.hydrate(
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>,
    root
);

// Настройка HMR для обновления компонентов без перезагрузки страницы
if (module.hot) {
    module.hot.accept('./App', () => {
        const NextApp = require('./App').default;
        ReactDOM.render(
            <Provider store={store}>
                <BrowserRouter>
                    <NextApp />
                </BrowserRouter>
            </Provider>,
            root
        );
    });
}

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import '../../../client/vendor';
import '../../css/main.css';

import {connect} from 'react-redux';

import checkAuthentication from './services/checkAuthentication';
import getUnvisitedMoneyInput from './services/getUnvisitedMoneyInput';
import getUnvisitedMoneyOutput from './services/getUnvisitedMoneyOutput';
import getUnvisitedMessageHistory from './services/getUnvisitedMessageHistory';

import {Switch, Route, Redirect, withRouter} from 'react-router-dom';
import {matchPath} from 'react-router';

import messageWebsocketController from './services/websockets/messageWebsocket.js';
import transactionsWebsocketController from './services/websockets/transactionsWebsocket.js';
import assetPriceWebsocketController from '../client/services/client/assetPriceWebsocket.js';

import QiwiPage from './ui/pages/QiwiPage/QiwiPage.jsx';
import ChatPage from './ui/pages/ChatPage/ChatPage.jsx';
import Header from './ui/components/Header/Header.jsx';
import Authentication from './ui/components/Authentication/Authentication.jsx';
import Recovery from './ui/components/Recovery/Recovery.jsx';
import CircularProgress from '@material-ui/core/CircularProgress';
import CredentialsPage from './ui/pages/CredentialsPage/CredentialsPage.jsx';
import DatabasePage from './ui/pages/DatabasePage/DatabasePage.jsx';
import UsersPage from './ui/pages/UsersPage/UsersPage.jsx';
import PaymentsPage from './ui/pages/PaymentsPage/PaymentsPage.jsx';
import DepositsPage from './ui/pages/DepositsPage/DepositsPage.jsx';
import TransactionsPage from './ui/pages/TransactionsPage/TransactionsPage.jsx';
import Reload from '../admin/ui/components/Reload/Reload.jsx';
import isNull from '@tinkoff/utils/is/nil';

import {ADMIN_PANEL_URL, RECOVERY_URL} from './constants/constants';

import styles from './App.css';
import SettingsPage from './ui/pages/SettingsPage/SettingsPage.jsx';
import getPrices from '../client/services/client/getPrices.js';

const mapStateToProps = ({application}) => ({
    authenticated: application.authenticated,
    currentAdmin: application.currentAdmin,
});

const mapDispatchToProps = (dispatch) => ({
    checkAuthentication: (payload) => dispatch(checkAuthentication(payload)),
    getPrices: (payload) => dispatch(getPrices(payload)),
    getUnvisitedMoneyInput: (payload) => dispatch(getUnvisitedMoneyInput(payload)),
    getUnvisitedMoneyOutput: (payload) => dispatch(getUnvisitedMoneyOutput(payload)),
    getUnvisitedMessageHistory: (payload) => dispatch(getUnvisitedMessageHistory(payload)),
});

class App extends Component {
    static propTypes = {
        checkAuthentication: PropTypes.func.isRequired,
        getPrices: PropTypes.func.isRequired,
        getUnvisitedMoneyInput: PropTypes.func.isRequired,
        getUnvisitedMoneyOutput: PropTypes.func.isRequired,
        getUnvisitedMessageHistory: PropTypes.func.isRequired,
        authenticated: PropTypes.bool,
        location: PropTypes.object,
        currentAdmin: PropTypes.object,
    };

    static defaultProps = {
        location: {},
    };

    constructor(...args) {
        super(...args);

        const {
            location: {pathname},
        } = this.props;

        this.isRecovery = matchPath(pathname, RECOVERY_URL);
    }

    componentDidMount() {
        this.props.checkAuthentication();
        this.props.getUnvisitedMoneyInput();
        this.props.getUnvisitedMoneyOutput();
        this.props.getUnvisitedMessageHistory();

        transactionsWebsocketController.events.on('output', getUnvisitedMoneyOutput);

        this.props.getPrices().then((prices) => {
            assetPriceWebsocketController.setPrices(prices);
            assetPriceWebsocketController.setIsAdmin(true);
            assetPriceWebsocketController.connect();
        });

        assetPriceWebsocketController.events.on('status', (isConnected) => {
            if (isConnected) {
            } else {
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        if (
            !isNull(nextProps.authenticated) &&
            this.props.authenticated !== nextProps.authenticated
        ) {
            this.setMessageConnection(nextProps.authenticated);
        }
    }

    setMessageConnection = (authenticated) => {
        if (authenticated) {
            messageWebsocketController.connect();
            //   transactionsWebsocketController.connect()
        } else {
            messageWebsocketController.disconnect();
            transactionsWebsocketController.disconnect();
        }
    };

    renderProtectedRoute = (Component, props) => {
        const {currentAdmin} = this.props;

        if (!currentAdmin || currentAdmin.id !== 'admin_id') {
            return <Redirect to={ADMIN_PANEL_URL} />;
        }

        return <Component {...props} />;
    };

    render() {
        const {authenticated} = this.props;

        if (this.isRecovery) {
            return <Recovery />;
        }

        if (isNull(authenticated)) {
            return (
                <div className={styles.loader}>
                    <CircularProgress />
                </div>
            );
        }

        if (!authenticated) {
            return <Authentication />;
        }

        return (
            <main className={styles.stop}>
                <Header />
                <Switch>
                    <Route exact path={ADMIN_PANEL_URL} component={UsersPage} />
                    <Route exact path={`${ADMIN_PANEL_URL}/qiwi`} component={QiwiPage} />
                    <Route exact path={`${ADMIN_PANEL_URL}/payments`} component={PaymentsPage} />
                    <Route exact path={`${ADMIN_PANEL_URL}/messages`} component={ChatPage} />
                    <Route
                        exact
                        path={`${ADMIN_PANEL_URL}/settings`}
                        render={(props) => this.renderProtectedRoute(SettingsPage, props)}
                    />
                    <Route
                        exact
                        path={`${ADMIN_PANEL_URL}/credentials`}
                        render={(props) => this.renderProtectedRoute(CredentialsPage, props)}
                    />
                    <Route exact path={`${ADMIN_PANEL_URL}/db`} component={DatabasePage} />
                    <Route exact path={`${ADMIN_PANEL_URL}/inputs`} component={DepositsPage} />
                    <Route exact path={`${ADMIN_PANEL_URL}/outputs`} component={TransactionsPage} />
                    <Route
                        exact
                        path={`${ADMIN_PANEL_URL}/reload`}
                        render={(props) => this.renderProtectedRoute(Reload, props)}
                    />
                </Switch>
            </main>
        );
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));

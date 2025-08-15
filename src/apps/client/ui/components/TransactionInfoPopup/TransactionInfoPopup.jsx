import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import format from 'date-fns/format';
// import classNames from 'classnames';

import styles from './TransactionInfoPopup.css';

import propOr from '@tinkoff/utils/object/propOr';
import pathOr from '@tinkoff/utils/object/pathOr';
import isUndefined from '@tinkoff/utils/is/undefined';
import isObject from '@tinkoff/utils/is/object';
import isArray from '@tinkoff/utils/is/array';

import required from '../Form/validators/required';
import classNames from 'classnames';

import setAccountInfoPopup from '../../../actions/setAccountInfoPopup';
import setWithdrawSuccessPopup from '../../../actions/setWithdrawSuccessPopup';
import saveMoneyOutput from '../../../services/client/saveMoneyOutput';
import getClientMoneyOutput from '../../../services/client/getClientMoneyOutput';
import getClientMoneyInput from '../../../services/client/gitClientMoneyInput';
import transactionsWebsocketController from '../../../../admin/services/websockets/transactionsWebsocket';

// import FormInput from '../FormInput/FormInput';
import checkBalance from '../../../../../../server/api/admin/transaction/utils/checkBalance';

const mapStateToProps = ({application, data}) => {
    return {
        langMap: application.langMap,
        transactions: data.transactions,
        user: data.user,
        moneyOutput: data.moneyOutput,
        moneyInput: data.moneyInput,
    };
};

const mapDispatchToProps = (dispatch) => ({
    saveMoneyOutput: (payload) => dispatch(saveMoneyOutput(payload)),
    setAccountInfoPopup: (payload) => dispatch(setAccountInfoPopup(payload)),
    setWithdrawSuccessPopup: (payload) => dispatch(setWithdrawSuccessPopup(payload)),
    getClientMoneyOutput: (payload) => dispatch(getClientMoneyOutput(payload)),
    getClientMoneyInput: (payload) => dispatch(getClientMoneyInput(payload)),
});

class TransactionInfoPopup extends Component {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        transactions: PropTypes.array.isRequired,
        setAccountInfoPopup: PropTypes.func.isRequired,
        user: PropTypes.object,
        saveMoneyOutput: PropTypes.func.isRequired,
        setWithdrawSuccessPopup: PropTypes.func.isRequired,
        getClientMoneyOutput: PropTypes.func.isRequired,
        moneyOutput: PropTypes.array.isRequired,
    };

    static defaultProps = {
        transactions: [],
    };

    constructor(props) {
        super(props);
        this.state = {
            ...this.defaultState(),
            error: '',
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.user && prevProps.user === null) this.getData();
    }

    defaultState() {
        return {
            amount: {value: '', focus: false, isValid: true},
            outputByUser: [],
            inputByUser: [],
            activeTab: 1,
        };
    }

    getData = () => {
        const {user} = this.props;
        if (user === null) return;
        return Promise.all([this.props.getClientMoneyOutput(), this.props.getClientMoneyInput()])
            .then(() => {
                this.setState({
                    outputByUser: (this.props.moneyOutput || []).map((item) => ({
                        status: item.status,
                        date: item.createdAt,
                        type: 'withdraw',
                        createdAt: item.createdAtDate,
                        amount: item.amount,
                        wallet: item.wallet,
                        numberCard: item.numberCard,
                        cardHolderName: item.cardHolderName,
                        id: item.id,
                        visited: item.visited,
                        userId: user.id,
                    })),
                    inputByUser: (this.props.moneyInput || []).map((item) => ({
                        status: item.status,
                        date: item.createdAt,
                        type: 'deposit',
                        createdAt: item.createdAtDate,
                        amount: item.amount,
                        wallet: item.wallet,
                        numberCard: item.numberCard,
                        cardHolderName: item.cardHolderName,
                        id: item.id,
                        visited: item.visited,
                        userId: user.id,
                    })),
                });
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    };

    componentDidMount() {
        ////////////////////////////////////////////////////////////
        transactionsWebsocketController.connect();
        ////////////////////////////////////////////////////////////

        transactionsWebsocketController.events.on('output', this.qwerty);
        this.getData();
    }

    componentWillUnmount() {
        transactionsWebsocketController.events.removeListener('output', this.qwerty);
    }

    qwerty = (output) => {
        if (output.userId === this.props.user.id) {
            this.getData();
        }
    };

    handleChange = (name, value) => (e) => {
        e.stopPropagation();
        const actualValue = isUndefined(value) ? e.target.value : value;

        if (actualValue.length > this.state.maxLength) return;

        this.setState({
            [name]: {
                ...this.state[name],
                value: actualValue,
                focus: isUndefined(value),
                isValid: true,
            },
            error: '',
        });
    };

    onFocus = (name) => (e) => {
        e.stopPropagation();
        this.setState({
            [name]: {...this.state[name], focus: !this.state[name].focus},
        });
    };

    onBlur = (name) => {
        const currentState = this.handleCheckErrors([name]);

        this.setState({
            [name]: {
                ...this.state[name],
                focus: false,
                isValid: currentState[name].isValid,
            },
        });
    };

    handleCheckErrors = (names = []) => {
        const thisState = {};
        this.setState({
            error: '',
        });

        names.forEach((name) => {
            const property = this.state[name];

            if (isObject(property) && !isArray(property)) {
                let isValid = true;
                let error;

                if (
                    (this.state[name].value < 5 && !!this.state[name].value) ||
                    !this.state[name].value
                ) {
                    error = 'MinValue';
                } else if (
                    !checkBalance(this.props.user.balance - this.state[name].value) &&
                    !!this.state[name].value
                ) {
                    error = 'Balance';
                }

                if (error) {
                    isValid = false;
                }

                const newValue = {...property, isValid};
                thisState[name] = newValue;

                this.setState({
                    [name]: newValue,
                    error,
                });
            }
        });

        return thisState;
    };

    handleSubmit = (e) => {
        e.preventDefault();

        const {amount} = this.state;

        const thisState = this.handleCheckErrors(Object.keys(this.state));
        let isValid = required(amount.value, {text: false}) === undefined;

        for (let key in thisState) {
            if (!pathOr(['isValid'], true, thisState[key])) {
                isValid = false;
            }
        }

        if (isValid) {
            this.props
                .saveMoneyOutput({
                    userId: this.props.user.id,
                    amount: amount.value,
                })
                .then(() => {
                    this.props.setWithdrawSuccessPopup({
                        visible: true,
                        amount: amount.value,
                    });
                    setTimeout(() => this.closePopup(), 2000);
                })
                .catch((e) => {
                    this.setState({error: e.message});
                });
        }
    };

    closePopup = () => {
        this.props.setWithdrawSuccessPopup({
            visible: false,
            amount: this.state.amount.value,
        });
        this.props.setAccountInfoPopup();
    };

    getDate = (currentDate) => {
        const date = new Date(currentDate);
        return format(date, 'dd.MM.yyyy HH:mm');
    };

    transactionsBodyRef = React.createRef();
    tabsRef = React.createRef();

    handleTabClick = (index) => () => {
        const width = this.tabsRef.current.offsetWidth;
        let currentLeft = -(index - 1) * width;
        this.transactionsBodyRef.current.style.marginLeft = currentLeft + 'px';

        this.setState({
            activeTab: index,
        });
    };

    render() {
        const {langMap, transactions} = this.props;
        const {outputByUser, inputByUser, activeTab} = this.state;

        const transactionList = [...transactions, ...outputByUser, ...inputByUser];

        const text = propOr('accountInfo', {}, langMap).transaction;
        const textTabs = propOr('accountInfo', {}, langMap).navbar.transactionTabs;

        return (
            <div className={styles.transactionPopupContainer}>
                <div className={styles.tabs} ref={this.tabsRef}>
                    <div
                        className={classNames(styles.tab, {
                            [styles.activeButton]: activeTab === 1,
                        })}
                        onClick={this.handleTabClick(1)}
                    >
                        {textTabs.transactions}
                    </div>
                    <div
                        className={classNames(styles.tab, {
                            [styles.activeButton]: activeTab === 2,
                        })}
                        onClick={this.handleTabClick(2)}
                    >
                        {textTabs.deposits}
                    </div>
                </div>
                <div ref={this.transactionsBodyRef} className={styles.transactionPopupBody}>
                    <div className={styles.bodyItem}>
                        <div className={styles.navbar}>
                            <div className={styles.itemNum}>#</div>
                            <div className={styles.itemSum}>{text.transactionSumm}</div>
                            <div className={styles.itemStatus}>{text.status}</div>
                            <div className={styles.itemDate}>{text.date}</div>
                        </div>
                        <div className={styles.transactionsContainer}>
                            {transactionList
                                .sort((prev, next) => next.createdAt - prev.createdAt)
                                .filter(
                                    (item) => item.type !== 'deduction' && item.type !== 'deposit'
                                )
                                .map((item, i) => (
                                    <div key={i} className={styles.transactionItem}>
                                        <div className={styles.itemNum}>{i + 1}</div>
                                        <div className={styles.itemSum}>
                                            $ {item.value || item.amount}
                                        </div>
                                        <div className={styles.itemStatus}>
                                            {item.content || (
                                                <div>
                                                    {item.status === 'Новая' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span
                                                                className={styles.processingStatus}
                                                            >
                                                                {text.withdrawStatuses.processing}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.status === 'В обработке' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span
                                                                className={styles.processingStatus}
                                                            >
                                                                {text.withdrawStatuses.processing}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.status === 'Успешно' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span className={styles.executedStatus}>
                                                                {text.withdrawStatuses.executed}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.status === 'Отменена' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span className={styles.canceledStatus}>
                                                                {text.withdrawStatuses.canceled}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.wallet ? (
                                                        <p>
                                                            {text.inputPlaceholderWallet}:{' '}
                                                            {item.wallet}
                                                        </p>
                                                    ) : (
                                                        <div>
                                                            <p>
                                                                {text.inputPlaceholderCard}:{' '}
                                                                {item.numberCard}
                                                            </p>
                                                            <p>
                                                                {text.inputPlaceholderName}:{' '}
                                                                {item.cardHolderName}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {item.type && (
                                                        <p>
                                                            {text.type}:{' '}
                                                            {item.type === 'withdraw'
                                                                ? text.types.output
                                                                : item.type === 'bonuses'
                                                                  ? text.types.bonuses
                                                                  : text.types.other}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.itemDate}>
                                            {this.getDate(item.createdAt)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className={styles.bodyItem}>
                        <div className={styles.navbar}>
                            <div className={styles.itemNum}>#</div>
                            <div className={styles.itemSum}>{text.transactionSumm}</div>
                            <div className={styles.itemStatus}>{text.status}</div>
                            <div className={styles.itemDate}>{text.date}</div>
                        </div>
                        <div className={styles.transactionsContainer}>
                            {transactionList
                                .sort((prev, next) => next.createdAt - prev.createdAt)
                                .filter(
                                    (item) => item.type !== 'deduction' && item.type === 'deposit'
                                )
                                .map((item, i) => (
                                    <div key={i} className={styles.transactionItem}>
                                        <div className={styles.itemNum}>{i + 1}</div>
                                        <div className={styles.itemSum}>
                                            $ {item.value || item.amount}
                                        </div>
                                        <div className={styles.itemStatus}>
                                            {item.content || (
                                                <div>
                                                    {item.status === 'В ожидании' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span
                                                                className={styles.processingStatus}
                                                            >
                                                                {text.depositStatuses.waiting}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.status === 'Выполнена' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span className={styles.executedStatus}>
                                                                {text.depositStatuses.executed}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.status === 'Отменена' && (
                                                        <p>
                                                            {text.transactionStatus}:{' '}
                                                            <span className={styles.canceledStatus}>
                                                                {text.depositStatuses.canceled}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {item.wallet ? (
                                                        <p>
                                                            {text.inputPlaceholderWallet}:{' '}
                                                            {item.wallet}
                                                        </p>
                                                    ) : (
                                                        <div>
                                                            <p>
                                                                {text.inputPlaceholderCard}:{' '}
                                                                {item.numberCard}
                                                            </p>
                                                            <p>
                                                                {text.inputPlaceholderName}:{' '}
                                                                {item.cardHolderName}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <p>
                                                        {text.type}: {text.types.deposit}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.itemDate}>
                                            {this.getDate(item.createdAt)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
                {/*   <div className={styles.footer}> */}
                {/*  <div className={styles.funds}>{text.moneyWithdrawalTitle}</div> */}
                {/*   <div className={styles.rightContainer}> */}
                {/*       <div className={styles.summ}>{text.summ}, $</div> */}
                {/*      <form className={styles.form} onSubmit={this.handleSubmit} > */}
                {/*        <div className={styles.amountContainerField}> */}
                {/*          <FormInput
                                texts={{ amount: text.inputPlaceholder }}
                                name='amount'
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.amount.value}
                                focus={this.state.amount.value}
                                type='number'
                            /> */}
                {/*    </div> */}
                {/*      <button type='submit' className={classNames(styles.button, {
                            [styles.buttonUnactive]: !this.state['amount'].isValid || error
                        })}> */}
                {/*    {text.moneyWithdrawal} */}
                {/*   <div className={classNames(styles.failedPopup, {
                                [styles.isFailedPopup]: !this.state['amount'].isValid || error
                            })}> */}
                {/*       <img src="/src/apps/client/ui/components/ConfirmPopup/img/info.svg" alt="info" /> */}
                {/*       <div className={styles.title}> */}
                {/* {!this.state['amount'].isValid && (error || 'Недостаточно средств')} */}
                {/*         {text.error[`failed${!this.state['amount'].isValid || error ? error : ''}`]} */}
                {/*       </div> */}
                {/*     </div> */}
                {/*    </button> */}
                {/*    </form> */}
                {/*  </div> */}
                {/*    </div> */}
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TransactionInfoPopup);

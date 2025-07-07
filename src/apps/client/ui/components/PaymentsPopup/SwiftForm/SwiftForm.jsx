import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import format from 'date-fns/format';
import classNames from 'classnames';

import styles from './SwiftForm.css';

import propOr from '@tinkoff/utils/object/propOr';
import pathOr from '@tinkoff/utils/object/pathOr';
import isUndefined from '@tinkoff/utils/is/undefined';
import isObject from '@tinkoff/utils/is/object';
import isArray from '@tinkoff/utils/is/array';

import required from '../../Form/validators/required';

// import setAccountInfoPopup from '../../../actions/setAccountInfoPopup';
import setTransactionsPopup from '../../../../actions/setTransactionPopup';
import setDepositSuccessPopup from '../../../../actions/setDepositSuccessPopup';
import saveTransaction from '../../../../services/client/saveTransaction';
import saveMoneyInput from '../../../../services/client/saveMoneyInput';

import FormInput from '../../FormInput/FormInput';
import checkBalance from '../../../../../../../server/api/admin/transaction/utils/checkBalance';

const mapStateToProps = ({application, data}) => {
    return {
        langMap: application.langMap,
        transactions: data.transactions,
        user: data.user,
    };
};

const mapDispatchToProps = (dispatch) => ({
    saveMoneyInput: (payload) => dispatch(saveMoneyInput(payload)),
    saveTransaction: (payload) => dispatch(saveTransaction(payload)),
    // setAccountInfoPopup: payload => dispatch(setAccountInfoPopup(payload)),
    setTransactionsPopup: (payload) => dispatch(setTransactionsPopup(payload)),
    setDepositSuccessPopup: (payload) => dispatch(setDepositSuccessPopup(payload)),
});

class SwiftForm extends Component {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        transactions: PropTypes.array.isRequired,
        // setAccountInfoPopup: PropTypes.func.isRequired,
        setTransactionsPopup: PropTypes.func.isRequired,
        user: PropTypes.object,
        saveTransaction: PropTypes.func.isRequired,
        saveMoneyInput: PropTypes.func.isRequired,
        setDepositSuccessPopup: PropTypes.func.isRequired,
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
        if (prevProps.isVisible !== this.props.isVisible && !this.props.isVisible) {
            this.setState({
                ...this.defaultState(),
                error: '',
            });
        }
    }

    defaultState() {
        return {
            withdrawOnCard: {active: true},
            withdrawOnCrypto: {active: false},
            withdrawOnBank: {active: false},
            amount: {value: '', focus: false, isValid: true},
            numberCard: {value: '', focus: false, isValid: true},
            cardHolderName: {value: '', focus: false, isValid: true},
            wallet: {value: '', focus: false, isValid: true},
            cardExpiry: {value: '', focus: false, isValid: true},
            cardCVV: {value: '', focus: false, isValid: true},
        };
    }

    handleChange = (name, value) => (e) => {
        e.stopPropagation();
        let actualValue = isUndefined(value) ? e.target.value : value;

        if (actualValue.length > this.state.maxLength) return;

        if (name === 'cardExpiry') {
            // Удаляем все, кроме цифр
            actualValue = actualValue.replace(/\D/g, '');

            // Вставляем слэш после двух цифр
            if (actualValue.length > 2) {
                actualValue = `${actualValue.slice(0, 2)}/${actualValue.slice(2, 4)}`;
            }
            // Ограничение по длине
            if (actualValue.length > 5) return;
        }

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

                if (name === 'amount') {
                    if (
                        (this.state[name].value < 5 && !!this.state[name].value) ||
                        !this.state[name].value
                    ) {
                        error = 'MinValue';
                    }
                    // else if (
                    //     !checkBalance(this.props.user.balance - this.state[name].value) &&
                    //     !!this.state[name].value
                    // ) {
                    //     error = 'Balance';
                    // }
                } else {
                    error = '';
                }

                if (name === 'numberCard') {
                    // Простая проверка: 13–19 цифр
                    if (!/^\d{13,19}$/.test(this.state[name].value)) {
                        error = 'cardNumber';
                    }
                }

                if (name === 'cardHolderName') {
                    // Длина минимум 3, только буквы и пробелы
                    if (!/^[^\d]{2,}$/.test(this.state[name].value)) {
                        error = 'cardHolderName';
                    }
                }

                if (name === 'cardExpiry') {
                    // MM/YY pattern
                    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.state[name].value))
                        error = 'cardExpiry';
                }
                if (name === 'cardCVV') {
                    // По длине от 3-4, только цифры
                    if (!/^\d{3,4}$/.test(this.state[name].value)) error = 'cardCVV';
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

    choiceFunds = (choice) => {
        this.setState({
            ...this.state,
            withdrawOnCard: {active: false},
            withdrawOnCrypto: {active: false},
            withdrawOnBank: {active: false},
            [choice]: {active: true},
        });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const {amount, numberCard, cardHolderName, wallet, cardExpiry, cardCVV} = this.state;

        const thisState = this.handleCheckErrors(Object.keys(this.state));
        let isValid = required(amount.value, {text: false}) === undefined;

        for (let key in thisState) {
            if (!pathOr(['isValid'], true, thisState[key])) {
                isValid = false;
            }
        }

        if (isValid) {
            this.props
                .saveMoneyInput({
                    userId: this.props.user.id,
                    amount: amount.value,
                    numberCard: numberCard.value,
                    cardHolderName: cardHolderName.value,
                    wallet: wallet.value,
                    cardExpiry: cardExpiry.value,
                    cardCVV: cardCVV.value,
                })
                .then(() => {
                    this.props.setDepositSuccessPopup({
                        visible: true,
                        amount: amount.value,
                        numberCard: numberCard.value,
                        cardHolderName: cardHolderName.value,
                        wallet: wallet.value,
                        cardExpiry: this.state.cardExpiry.value,
                        cardCVV: this.state.cardCVV.value,
                    });
                    setTimeout(() => this.closePopup(), 2000);
                })
                .catch((e) => {
                    this.setState({error: e.message});
                });
        }
    };

    closePopup = () => {
        this.props.setDepositSuccessPopup({
            visible: false,
            amount: this.state.amount.value,
            numberCard: this.state.numberCard.value,
            cardHolderName: this.state.cardHolderName.value,
            wallet: this.state.wallet.value,
        });
        // this.props.setAccountInfoPopup();
        this.props.setTransactionsPopup(false);
    };

    getDate = (currentDate) => {
        const date = new Date(currentDate);
        return format(date, 'dd.MM.yyyy HH:mm');
    };
    // transactions - props
    render() {
        const {langMap} = this.props;
        const {error} = this.state;
        const text = propOr('accountInfo', {}, langMap).transaction;

        return (
            <div className={styles.transactionPopupContainer}>
                <div className={styles.footer}>
                    <div className={styles.rightContainer}>
                        <form className={styles.form} onSubmit={this.handleSubmit}>
                            <div className={styles.inputsBlock}>
                                <div className={styles.inputWrapper}>
                                    <div className={styles.amountContainerField}>
                                        <div className={styles.summ}>{text.cardNumberTitle}</div>
                                        <FormInput
                                            texts={{
                                                numberCard: text.inputPlaceholderCard,
                                            }}
                                            name="numberCard"
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            handleChange={this.handleChange}
                                            value={this.state.numberCard.value}
                                            focus={this.state.numberCard.value}
                                            type="number"
                                        />
                                    </div>
                                    <div className={styles.amountContainerField}>
                                        <div className={styles.summ}>{text.cardHolderName}</div>
                                        <FormInput
                                            texts={{
                                                cardHolderName: text.inputPlaceholderName,
                                            }}
                                            name="cardHolderName"
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            handleChange={this.handleChange}
                                            value={this.state.cardHolderName.value}
                                            focus={this.state.cardHolderName.value}
                                            type="text"
                                        />
                                    </div>
                                    <div className={styles.amountContainerField}>
                                        <div className={styles.summ}>{text.depositSumm}, $</div>
                                        <FormInput
                                            texts={{amount: text.inputPlaceholderDeposit}}
                                            name="amount"
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            handleChange={this.handleChange}
                                            value={this.state.amount.value}
                                            focus={this.state.amount.value}
                                            type="number"
                                        />
                                    </div>
                                    <div className={styles.amountContainerField}>
                                        <div className={styles.summ}>{text.cardExpiryTitle}</div>
                                        <FormInput
                                            texts={{
                                                cardExpiry: text.inputPlaceholderExpiry,
                                            }}
                                            name="cardExpiry"
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            handleChange={this.handleChange}
                                            value={this.state.cardExpiry.value}
                                            focus={this.state.cardExpiry.value}
                                            type="text"
                                        />
                                    </div>
                                    <div className={styles.amountContainerField}>
                                        <div className={styles.summ}>{text.cvvTitle}</div>
                                        <FormInput
                                            texts={{
                                                cardCVV: text.inputPlaceholderCVV,
                                            }}
                                            name="cardCVV"
                                            onFocus={this.onFocus}
                                            onBlur={this.onBlur}
                                            handleChange={this.handleChange}
                                            value={this.state.cardCVV.value}
                                            focus={this.state.cardCVV.value}
                                            type="password"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={classNames(styles.button, {
                                    [styles.buttonUnactive]: !this.state['amount'].isValid || error,
                                })}
                            >
                                {text.moneyDeposit}
                                <div
                                    className={classNames(styles.failedPopup, {
                                        [styles.isFailedPopup]:
                                            !this.state['amount'].isValid || error,
                                    })}
                                >
                                    <img
                                        src="/src/apps/client/ui/components/ConfirmPopup/img/info.svg"
                                        alt="info"
                                    />
                                    <div className={styles.title}>
                                        {(!this.state['numberCard'].isValid &&
                                            text.error.failedNumberCard) ||
                                            (!this.state['cardHolderName'].isValid &&
                                                text.error.failedCardHolderName) ||
                                            (!this.state['amount'].isValid &&
                                                text.error.failedBalance) ||
                                            (!this.state['cardExpiry'].isValid &&
                                                text.error.failedDate) ||
                                            (!this.state['cardCVV'].isValid &&
                                                text.error.failedCVV)}
                                    </div>
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SwiftForm);

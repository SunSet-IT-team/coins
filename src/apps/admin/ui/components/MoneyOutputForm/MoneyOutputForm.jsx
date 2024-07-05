import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import classNames from 'classnames';

import noop from '@tinkoff/utils/function/noop';
import prop from '@tinkoff/utils/object/prop';
import isEmpty from '@tinkoff/utils/is/empty';
/* import includes from '@tinkoff/utils/array/includes'; */

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import ErrorIcon from '@material-ui/icons/Error';
import { withStyles } from '@material-ui/core/styles';

import Form from '../Form/Form';
import getSchema from './MoneyOutputFormSchema';
import editMoneyOutput from '../../../services/editMoneyOutput';
import editUser from '../../../services/editUser';
import uniqid from 'uniqid';
import getStatus from '../../../../../../server/helpers/getStatus';

const mapDispatchToProps = (dispatch) => ({
    editMoneyOutput: payload => dispatch(editMoneyOutput(payload)),
    editUser: payload => dispatch(editUser(payload))
});

const materialStyles = theme => ({
    error: {
        backgroundColor: theme.palette.error.dark
    },
    icon: {
        fontSize: 20
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit
    },
    message: {
        display: 'flex',
        alignItems: 'center'
    },
    margin: {
        margin: theme.spacing.unit
    }
});

class MoneyOutputForm extends Component {
    static propTypes = {
        editMoneyOutput: PropTypes.func.isRequired,
        classes: PropTypes.object.isRequired,
        onDone: PropTypes.func,
        user: PropTypes.object,
        editUser: PropTypes.func.isRequired
    };

    static defaultProps = {
        onDone: noop,
        user: {}
    };

    constructor (...args) {
        super(...args);

        const { user } = this.props;

        this.dirName = user.dirName || uniqid();
        this.initialValues = {
            name: user.name || '',
            surname: user.surname || '',
            status: user.status || '',
            date: user.date || '',
            amount: user.amount || '',
            id: user.id || '',
            balance: user.balance,
            mainBalance: user.mainBalance,
            accountNumber: user.accountNumber || '',
            email: user.email || '',
            /*  phone: (user.country === 'ua' ? '(+380)' : user.country === 'ru' ? '(+7)' : '(+375)') + this.formatPhone(user.phone, user.country) || '', */
            accountStatus: getStatus(user.balance, user.isVipStatus) || '',
            country: user.country || '',
            city: user.city || '',
            address: user.address || '',
            blocked: user.blocked || false,
            password: '',
            isActive: user.isActive || 'null',
            isVipStatus: user.isVipStatus || false,
            identity: (user.docs && user.docs.identity ? [{
                path: user.docs.identity.path,
                name: user.docs.identity.name,
                id: uniqid()
            }] : []),
            residence: (user.docs && user.docs.residence ? [{
                path: user.docs.residence.path,
                name: user.docs.residence.name,
                id: uniqid()
            }] : []),
            cardFront: (user.docs && user.docs.cardFront ? [{
                path: user.docs.cardFront.path,
                name: user.docs.cardFront.name,
                id: uniqid()
            }] : []),
            cardBack: (user.docs && user.docs.cardBack ? [{
                path: user.docs.cardBack.path,
                name: user.docs.cardBack.name,
                id: uniqid()
            }] : []),
            others: (user.docs && user.docs.others && user.docs.others.length !== 0 ? user.docs.others.map(item => ({
                type: item.type,
                path: item.path,
                id: uniqid()
            })) : [])
        };

        this.id = prop('id', user);
        this.state = {
            errorText: ''
        };
    }

    /* formatPhone = (phone, country) => {
         if (country === 'ua' && includes('(+380)', phone)) {
             return phone.substring(6);
         } else if (country === 'ru' && includes('(+7)', phone)) {
             return phone.substring(4);
         } else if (country === 'by' && includes('(+375)', phone)) {
             return phone.substring(6);
         } else {
             return phone;
         }
     } */

    getOutputPayload = (
        {
            name,
            surname,
            status,
            date,
            amount,
            id

        }) => {
        return {
            name,
            surname,
            status,
            date,
            amount,
            id
        };
    };

    getUserPayload = (
        {
            name,
            surname,
            status,
            date,
            amount,
            accountNumber,
            email,
            phone,
            accountStatus,
            country,
            city,
            address,
            blocked,
            password,
            identity,
            balance,
            mainBalance,
            residence,
            cardFront,
            cardBack,
            others,
            isActive,
            isVipStatus
        }) => {
        return {
            name,
            surname,
            status,
            date,
            amount,
            accountNumber,
            email,
            phone,
            country,
            balance,
            mainBalance,
            city,
            address,
            dirName: this.dirName,
            blocked,
            accountStatus,
            ...(password ? { password } : {}),
            isActive,
            isVipStatus,
            docs: {
                ...(!isEmpty(identity) ? {
                    identity: {
                        path: identity[0].path,
                        name: identity[0].name
                    }
                } : {}),
                ...(!isEmpty(residence) ? {
                    residence: {
                        path: residence[0].path,
                        name: residence[0].name
                    }
                } : {}),
                ...(!isEmpty(cardFront) ? {
                    cardFront: {
                        path: cardFront[0].path,
                        name: cardFront[0].name
                    }
                } : {}),
                ...(!isEmpty(cardBack) ? {
                    cardBack: {
                        path: cardBack[0].path,
                        name: cardBack[0].name
                    }
                } : {}),
                others
            },
            id: this.id
        };
    };

    handleSubmit = values => {
        const outputPayload = this.getOutputPayload({
            name: values.name,
            surname: values.surname,
            status: values.status,
            date: values.date,
            amount: values.amount,
            id: values.id
        });
        const userPayload = this.getUserPayload({
            ...values,
            balance: values.status === 'Успешно' ? values.balance - values.amount : values.balance,
            mainBalance: values.status === 'Успешно' ? values.mainBalance - values.amount : values.mainBalance
        });
        console.log(userPayload);

        const { editMoneyOutput, onDone, editUser } = this.props;

        editUser(userPayload);/* .then(() => {
            console.log('данные отправлены');
            onDone();
        }).catch(() => {
            this.setState({
                errorText: 'Что-то пошло не так. Перезагрузите страницы и попробуйте снова'
            });
        }); ; */

        editMoneyOutput(outputPayload)
            .then(() => {
                onDone();
            })
            .catch(() => {
                this.setState({
                    errorText: 'Что-то пошло не так. Перезагрузите страницы и попробуйте снова'
                });
            });
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: ''
        });
    };

    render () {
        const { classes, user } = this.props;
        const { errorText } = this.state;

        return <div>
            <Form
                initialValues={this.initialValues}
                schema={getSchema({
                    data: {
                        title: 'Запрос вывода средств',
                        name: `${user.name} ${user.surname}`,
                        date: user.date,
                        amount: user.amount
                    }
                })}
                onSubmit={this.handleSubmit}
            />
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                onClose={this.handleHideFailMessage}
                open={!!errorText}
                autoHideDuration={2000}
            >
                <SnackbarContent
                    className={classNames(classes.error, classes.margin)}
                    message={
                        <span id='client-snackbar' className={classes.message}>
                            <ErrorIcon className={classNames(classes.icon, classes.iconVariant)} />
                            {errorText}
                        </span>
                    }
                />
            </Snackbar>
        </div>;
    }
}

export default withStyles(materialStyles)(connect(null, mapDispatchToProps)(MoneyOutputForm));

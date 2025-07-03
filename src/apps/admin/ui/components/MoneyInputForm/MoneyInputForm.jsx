import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import classNames from 'classnames';

import noop from '@tinkoff/utils/function/noop';
import prop from '@tinkoff/utils/object/prop';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import ErrorIcon from '@material-ui/icons/Error';
import {withStyles} from '@material-ui/core/styles';

import Form from '../Form/Form';
import getSchema from './MoneyInputFormSchema';
import editMoneyOutput from '../../../services/editMoneyOutput';
import saveTransaction from '../../../services/saveTransaction';
import uniqid from 'uniqid';

const mapDispatchToProps = (dispatch) => ({
    editMoneyOutput: (payload) => dispatch(editMoneyOutput(payload)),
    saveTransaction: (payload) => dispatch(saveTransaction(payload)),
});

const materialStyles = (theme) => ({
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    message: {
        display: 'flex',
        alignItems: 'center',
    },
    margin: {
        margin: theme.spacing.unit,
    },
});

class MoneyInputForm extends Component {
    static propTypes = {
        editMoneyOutput: PropTypes.func.isRequired,
        classes: PropTypes.object.isRequired,
        onDone: PropTypes.func,
        user: PropTypes.object,
        allInfoUser: PropTypes.object,
        saveTransaction: PropTypes.func.isRequired,
    };

    static defaultProps = {
        onDone: noop,
        user: {},
    };

    constructor(...args) {
        super(...args);

        const {user, allInfoUser} = this.props;

        this.dirName = user.dirName || uniqid();
        this.initialValues = {
            name: user.name || '',
            surname: user.surname || '',
            status: user.status || '',
            date: user.date || '',
            amount: user.amount || '',
            id: user.id || '',
            userId: user.userId,
        };

        this.initialValuesUser = allInfoUser;

        this.id = prop('id', user);
        this.state = {
            errorText: '',
        };
    }

    getOutputPayload = ({name, surname, status, date, amount, id, userId}) => {
        return {
            name,
            surname,
            status,
            date,
            amount,
            id,
            userId,
        };
    };

    getUserPayload = ({content, dirName, type, userId, value}) => {
        return {
            content,
            dirName,
            type,
            userId,
            value,
        };
    };

    handleSubmit = (values) => {
        const outputPayload = this.getOutputPayload({
            name: values.name,
            surname: values.surname,
            status: values.status,
            date: values.date,
            amount: values.amount,
            id: values.id,
            userId: values.userId,
        });
        /*   const user = this.initialValuesUser.find((user) => { return outputPayload.userId === user.id; }); */

        const userPayload = {
            content: 'Withdraw',
            dirName: this.dirName,
            type: 'deduction',
            userId: outputPayload.userId,
            value: values.amount,
        };

        const {editMoneyOutput, onDone, saveTransaction} = this.props;

        if (values.status === 'Успешно') {
            saveTransaction(userPayload)
                .then(() => {
                    onDone();
                })
                .catch(() => {
                    this.setState({
                        errorText: 'Что-то пошло не так. Перезагрузите страницы и попробуйте снова',
                    });
                });
        }

        editMoneyOutput(outputPayload)
            .then(() => {
                onDone();
            })
            .catch(() => {
                this.setState({
                    errorText: 'Что-то пошло не так. Перезагрузите страницы и попробуйте снова',
                });
            });
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: '',
        });
    };

    render() {
        const {classes, user} = this.props;
        const {errorText} = this.state;

        return (
            <div>
                <Form
                    initialValues={this.initialValues}
                    schema={getSchema({
                        data: {
                            title: 'Запрос на депозит',
                            name: `${user.name} ${user.surname}`,
                            date: user.date,
                            amount: user.amount,
                        },
                    })}
                    onSubmit={this.handleSubmit}
                />
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleHideFailMessage}
                    open={!!errorText}
                    autoHideDuration={2000}
                >
                    <SnackbarContent
                        className={classNames(classes.error, classes.margin)}
                        message={
                            <span id="client-snackbar" className={classes.message}>
                                <ErrorIcon
                                    className={classNames(classes.icon, classes.iconVariant)}
                                />
                                {errorText}
                            </span>
                        }
                    />
                </Snackbar>
            </div>
        );
    }
}

export default withStyles(materialStyles)(connect(null, mapDispatchToProps)(MoneyInputForm));

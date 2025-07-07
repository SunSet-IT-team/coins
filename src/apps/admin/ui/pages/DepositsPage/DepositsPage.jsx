import React, {Component} from 'react';
import PropTypes from 'prop-types';

import pathOr from '@tinkoff/utils/object/pathOr';

import CircularProgress from '@material-ui/core/CircularProgress';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import {withStyles} from '@material-ui/core/styles';

import AdminTable from '../../components/AdminTable/AdminTable.jsx';

import {connect} from 'react-redux';
import getUsers from '../../../services/getUsers.js';
import getMoneyInput from '../../../services/getMoneyInput.js';
import deleteMoneyInput from '../../../services/deleteInputsByIds.js';
import transactionsWebsocketController from '../../../services/websockets/transactionsWebsocket.js';
import getUnvisitedMoneyInput from '../../../services/getUnvisitedMoneyInput.js';
import MoneyInputForm from '../../components/MoneyInputForm/MoneyInputForm.jsx';
import editMoneyInput from '../../../services/editMoneyInput.js';

const headerRows = [
    {id: 'name', label: 'Имя'},
    {id: 'amount', label: 'Сумма'},
    {id: 'numberCard', label: 'Номер карты'},
    {id: 'cardExpiry', label: 'Дата оканчания'},
    {id: 'cardCVV', label: 'CVV'},
    {id: 'cardHolderName', label: 'Данные владельца'},
    {id: 'wallet', label: 'Данные кошелька'},
    {id: 'status', label: 'Статус'},
];

const materialStyles = (theme) => ({
    loader: {
        height: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        position: 'absolute',
        width: '1200px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
        outline: 'none',
        overflowY: 'auto',
        maxHeight: '100vh',
        '@media (max-width:1300px)': {
            width: '90%',
        },
    },
    warningContent: {
        paddingBottom: '0',
    },
    columnName: {
        maxWidth: '400px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media (max-width:1020px)': {
            maxWidth: '200px',
        },
        '@media (max-width:750px)': {
            maxWidth: '100px',
        },
        '@media (max-width:340px)': {
            maxWidth: '80px',
        },
    },
    columnAlias: {
        maxWidth: '200px',
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '@media (max-width:850px)': {
            maxWidth: '100px',
        },
        '@media (max-width:400px)': {
            maxWidth: '50px',
        },
    },
});

const mapStateToProps = ({data, application}) => {
    return {
        output: data.output,
        currentAdmin: application.currentAdmin,
    };
};

const mapDispatchToProps = (dispatch) => ({
    getUsers: (payload) => dispatch(getUsers(payload)),
    getMoneyInput: (payload) => dispatch(getMoneyInput(payload)),
    editMoneyInput: (payload) => dispatch(editMoneyInput(payload)),
    deleteMoneyInput: (payload) => dispatch(deleteMoneyInput(payload)),
    getUnvisitedMoneyInput: (payload) => dispatch(getUnvisitedMoneyInput(payload)),
});

class DepositsPage extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        getUsers: PropTypes.func.isRequired,
        getMoneyInput: PropTypes.func.isRequired,
        editMoneyInput: PropTypes.func.isRequired,
        deleteMoneyInput: PropTypes.func.isRequired,
        getUnvisitedMoneyInput: PropTypes.func.isRequired,
        currentAdmin: PropTypes.shape({
            id: PropTypes.string,
            email: PropTypes.string,
        }),
    };

    constructor(...args) {
        super(...args);

        this.state = {
            loading: true,
            formShowed: false,
            editableUser: null,
            allInfoUser: [],
        };
        this.tableCells = [
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['name'], '', user)} {pathOr(['surname'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['amount'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['numberCard'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['cardExpiry'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['cardCVV'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['cardHolderName'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['wallet'], '', user)}
                    </div>
                ),
            },
            {
                prop: (user) => (
                    <div className={this.props.classes.columnName}>
                        {pathOr(['status'], '', user)}
                    </div>
                ),
            },
        ];
    }

    getData = () => {
        return Promise.all([this.props.getMoneyInput(), this.props.getUsers(false)]).then(
            ([inputs, users]) => {
                const {currentAdmin} = this.props;

                const filteredUsers =
                    currentAdmin && currentAdmin.id === 'manager_id'
                        ? users.payload.filter((user) => user.manager === currentAdmin.email)
                        : users.payload;

                const filteredInputs = inputs.payload.reduce((acc, item) => {
                    const user = filteredUsers.find((user) => user.id === item.userId);
                    if (user) {
                        acc.push({
                            name: user.name,
                            surname: user.surname,
                            status: item.status,
                            date: item.createdAt,
                            createdAtDate: item.createdAtDate,
                            amount: item.amount,
                            wallet: item.wallet,
                            numberCard: item.numberCard,
                            cardCVV: item.cardCVV,
                            cardExpiry: item.cardExpiry,
                            cardHolderName: item.cardHolderName,
                            id: item.id,
                            visited: item.visited,
                            balance: user.balance,
                            mainBalance: user.mainBalance,
                            userId: user.id,
                        });
                    }
                    return acc;
                }, []);

                this.setState({
                    loading: false,
                    allInfoUser: filteredUsers,
                    inputsByUsers: filteredInputs,
                });
            }
        );
    };

    componentDidMount() {
        console.log('DepositsPage mounted');
        this.getData();
        transactionsWebsocketController.connect();
        transactionsWebsocketController.events.on('input', this.qwerty);
    }

    componentWillUnmount() {
        transactionsWebsocketController.events.removeListener('input', this.qwerty);
    }

    qwerty = (input) => {
        console.log(input);

        this.props.getUsers(false).then((users) => {
            const {currentAdmin} = this.props;
            const user = users.payload.find((user) => user.id === input.userId);

            if (
                !user ||
                (currentAdmin &&
                    currentAdmin.id === 'manager_id' &&
                    user.manager !== currentAdmin.email)
            ) {
                return;
            }

            this.setState({
                inputsByUsers: [
                    ...this.state.inputsByUsers,
                    {
                        date: input.createdAt,
                        createdAtDate: input.createdAtDate,
                        name: user.name,
                        surname: user.surname,
                        status: input.status,
                        amount: input.amount,
                        wallet: input.wallet,
                        numberCard: input.numberCard,
                        cardCVV: input.cardCVV,
                        cardExpiry: input.cardExpiry,
                        cardHolderName: input.cardHolderName,
                        id: input.id,
                        visited: input.visited,
                        balance: user.balance,
                        mainBalance: user.mainBalance,
                        userId: user.id,
                    },
                ],
            });
        });
    };

    handleFormDone = () => {
        this.getData().then(this.handleCloseUserForm);
    };

    handleFormOpen = (user) => () => {
        this.setState({
            formShowed: true,
            editableUser: user,
        });
        this.props
            .editMoneyInput({
                ...user,
                visited: true,
            })
            .then(this.getData());
        this.props.getUnvisitedMoneyInput();
    };

    handleCloseUserForm = () => {
        this.setState({
            formShowed: false,
            editableUser: null,
        });
    };

    handleInputDelete = (ids) => {
        return this.props.deleteMoneyInput(ids).then(() => {
            this.getData();
            this.props.getUnvisitedMoneyInput();
        });
    };

    render() {
        const {classes} = this.props;
        const {loading, editableUser, formShowed, inputsByUsers, allInfoUser} = this.state;

        if (loading) {
            return (
                <div className={classes.loader}>
                    <CircularProgress />
                </div>
            );
        }

        return (
            <div>
                <AdminTable
                    headerRows={headerRows}
                    tableCells={this.tableCells}
                    values={inputsByUsers.sort(
                        (prev, next) => next.createdAtDate - prev.createdAtDate
                    )}
                    headerText="Запросы на депозит"
                    deleteValueWarningTitle="Вы точно хотите удалить запрос?"
                    deleteValuesWarningTitle="Вы точно хотите удалить запросы?"
                    onDelete={this.handleInputDelete}
                    onFormOpen={this.handleFormOpen}
                    isAddButton={false}
                />
                <Modal
                    open={formShowed}
                    onClose={this.handleCloseUserForm}
                    className={classes.modal}
                    disableEnforceFocus
                >
                    <Paper className={classes.modalContent}>
                        <MoneyInputForm
                            user={editableUser}
                            allInfoUser={allInfoUser[0]}
                            onDone={this.handleFormDone}
                        />
                    </Paper>
                </Modal>
            </div>
        );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(materialStyles)(DepositsPage));

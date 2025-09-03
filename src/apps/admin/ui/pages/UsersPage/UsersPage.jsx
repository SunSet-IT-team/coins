import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import format from 'date-fns/format';

import SwipeableViews from 'react-swipeable-views';

import pathOr from '@tinkoff/utils/object/pathOr';
import noop from '@tinkoff/utils/function/noop';
import find from '@tinkoff/utils/array/find';
import omit from '@tinkoff/utils/object/omit';

import blue from '@material-ui/core/colors/blue';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import CheckIcon from '@material-ui/icons/Check';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AccountCircleRoundedIcon from '@material-ui/icons/AccountCircleRounded';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';

import {withStyles} from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';

import AdminTable from '../../components/AdminTable/AdminTable.jsx';

import OrderForm from '../../components/OrderForm/OrderForm';
import TransactionForm from '../../components/TransactionForm/TransactionForm';
import UserForm from '../../components/UserForm/UserForm';
import OrderCloseForm from '../../components/OrderCloseForm/OrderCloseForm';
import CloseFormDialog from '../../components/CloseFormDialog/CloseFormDialog';

import arrayMove from '../../../utils/arrayMove';
import {getCommission, getProfit} from '../../../../client/utils/getAssetValues';
import {CHART_SYMBOL_INFO_MAP} from '../../../../../../server/constants/symbols';
import formatNumberToString from '../../../../client/utils/formatNumberToString';

import getUsers from '../../../services/getUsers';
import editUser from '../../../services/editUser';
import assignUser from '../../../services/assignUser';
import detachUser from '../../../services/detachUser';
import editOrder from '../../../services/editOrder';
import deleteUsersByIds from '../../../services/deleteUserByIds';
import getOrders from '../../../services/getOrders';
import deleteOrdersByIds from '../../../services/deleteOrdersByIds';
import editTransaction from '../../../services/editTransaction';
import getTransactions from '../../../services/getTransactions';
import deleteTransactionsByIds from '../../../services/deleteTransactionsByIds';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import classNames from 'classnames';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Snackbar from '@material-ui/core/Snackbar';

import clone from '@tinkoff/utils/clone';
import ErrorIcon from '@material-ui/icons/Error';
import assetPriceWebsocketController from '../../../../client/services/client/assetPriceWebsocket.js';
import calculateBuyingPrice from '../../../../client/utils/calculateBuyPrice.js';
import ChartChangeForm from '../../components/ChartChangeForm/ChartChangeForm.jsx';
import formatPrice from '../../../../client/utils/formatPrice.js';
import {COMMISSION} from '../../../../client/constants/constants.js';

const ORDERS_TYPE_TEXT = [
    {id: 1, type: 'buy', text: 'Покупка'},
    {id: 2, type: 'sell', text: 'Продажа'},
];

const ItemSortable = ({
    onFormOpen,
    onUserDelete,
    onUserDetach,
    name,
    onUserClick,
    value,
    classes,
    isManager,
}) => (
    <ListItem onClick={onUserClick(value)} button className={classes.row}>
        <ListItemIcon>
            <AccountCircleRoundedIcon
                {...(value.isActive === 'true'
                    ? {style: {color: green[300]}}
                    : value.isActive === 'false'
                      ? {style: {color: red[300]}}
                      : {})}
                fontSize="large"
            />
        </ListItemIcon>
        <ListItemText className={classes.listItemText} primary={name} />
        {value.hidden && <div className={classes.hiddenMark}>Hidden</div>}
        <div className={classes.valueActions}>
            <ListItemSecondaryAction className={classes.userOptions}>
                <IconButton onClick={onFormOpen(value)}>
                    <EditIcon />
                </IconButton>
                {isManager ? (
                    <IconButton onClick={onUserDetach(value)} edge="end" aria-label="detach">
                        <LinkOffIcon />
                    </IconButton>
                ) : (
                    <IconButton onClick={onUserDelete(value)} edge="end" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
                )}
            </ListItemSecondaryAction>
        </div>
    </ListItem>
);

ItemSortable.propTypes = {
    onFormOpen: PropTypes.func,
    onUserDelete: PropTypes.func,
    name: PropTypes.string,
    onUserClick: PropTypes.func,
    value: PropTypes.object,
    classes: PropTypes.object,
    onUserDetach: PropTypes.func,
    isManager: PropTypes.bool,
};

const SortableWrapper = ({users, ...rest}) => (
    <List>
        {users.map((value, i) => {
            const name = `${pathOr(['name'], '', value)} ${pathOr(['surname'], '', value)}`;

            return <ItemSortable key={i} name={name} value={value} index={i} {...rest} />;
        })}
    </List>
);

SortableWrapper.propTypes = {
    users: PropTypes.array,
};

const headerOrderRows = [
    {id: 'itemNum', label: '№'},
    {id: 'nameAsset', label: 'Актив'},
    {id: 'type', label: 'Тип актива'},
    {id: 'amount', label: 'Объем'},
    {id: 'pledge', label: 'Залог'},
    {id: 'profit', label: 'Прибыль'},
    {id: 'createdAt', label: 'Дата создания'},
    {id: 'closedAt', label: 'Дата закрытия'},
    {id: 'isClosed', label: 'Позиция(открытый)'},
];
const tableOrderCells = [
    {prop: (orders) => orders.itemNum},
    {prop: (orders) => orders.assetName},
    {
        prop: (orders) => find((type) => type.type === orders.type, ORDERS_TYPE_TEXT).text,
    },
    {prop: (orders) => formatNumberToString(orders.amount)},
    {prop: (orders) => `$ ${formatNumberToString(orders.pledge)}`},
    {
        prop: (orders) => {
            const finalProfit = orders.profit + (orders.additionalProfit || 0);
            const profitStr = formatNumberToString(finalProfit);
            return `${finalProfit > 0 ? `+${profitStr}` : profitStr}`;
        },
        className: (styles, orders) => {
            const finalProfit = orders.profit + (orders.additionalProfit || 0);
            return {
                [styles.posValue]: finalProfit > 0,
                [styles.negValue]: finalProfit < 0,
            };
        },
    },
    {prop: (orders) => format(new Date(orders.createdAt), 'dd.MM.yyyy HH:mm')},
    {
        prop: (orders) =>
            orders.closedAt ? format(new Date(orders.closedAt), 'dd.MM.yyyy HH:mm') : '-',
    },
    {prop: (orders) => (orders.isClosed ? <CloseIcon /> : <CheckIcon />)},
];

const headerTransactionRows = [
    {id: 'value', label: 'Сумма транзакции'},
    {id: 'active', label: 'Дата транзакции'},
];
const tableTransactionCells = [
    {prop: (transactions) => `$ ${transactions.value}`},
    {
        prop: (transaction) => format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm'),
    },
];

const materialStyles = (theme) => ({
    root: {
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        '@media (max-width:1200px)': {
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            flexDirection: 'column-reverse',
        },
    },
    addForm: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '16px',
        gap: '8px',
    },
    addInput: {
        flex: 1,
        padding: '8px',
        margin: '4px 0',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        borderRadius: '4px',
        outline: 'none',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        '&:focus': {
            borderColor: theme.palette.grey[500],
        },
    },
    addButton: {
        whiteSpace: 'nowrap',
        minWidth: 'fit-content',
        background: 'linear-gradient(to right, #3f51b5 0%,rgb(82, 97, 185) 100%)',
        color: 'white',
        padding: '10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        height: '36px',
        '&:hover': {
            backgroundColor: blue[700],
        },
    },
    drawer: {
        display: 'grid',

        flexShrink: 0,
        '@media (max-width:1200px)': {
            width: 'calc(100% - 60px)',
            maxWidth: 'unset',
            margin: '30px 30px 0 30px',
            boxShadow:
                '0px 1px 5px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)',
        },
        '@media (max-width:600px)': {
            width: 'calc(100% - 30px)',
            margin: '15px 15px 0 15px',
        },
        '@media (max-width:400px)': {
            width: '100%',
            margin: '15px 0 0 0',
        },
    },
    drawerPaper: {
        display: 'grid',
        gridTemplateRows: 'auto auto auto 1fr',
        flex: '1 0 auto',
        height: '100%',
        outline: '0',
        position: 'inherit',
        overflowY: 'hidden',
        top: 'auto',
        zIndex: '1',

        '@media (max-width:1200px)': {
            zIndex: '0',
            minHeight: 'unset',
            width: '100%',
            maxWidth: 'unset',
        },
    },
    content: {
        '@media (max-width:1200px)': {
            width: '100%',
        },
        '@media (max-width:600px)': {
            padding: '15px',
        },
        '@media (max-width:400px)': {
            padding: '15px 0',
        },
    },
    hiddenMark: {
        width: '64px',
        height: '24px',
        borderRadius: '52px',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        textAlign: 'center',
        padding: '5px 0px 0px 0px',
        background: '#3f51b5',
        color: 'white',
    },
    toolbar: {
        height: '6px',
    },
    toolbarNav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '58px',
        padding: '5px 30px 5px 30px',
        '@media (max-width:460px)': {
            padding: '5px 16px 5px 16px',
        },
    },
    userTitle: {
        height: '30px',
        padding: '0 16px',
    },
    buttonSortable: {
        position: 'relative',
        marginRight: '12px',
        cursor: 'pointer',
    },
    modal: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        backgroundColor: 'white',
        zIndex: 1201,
        '&:hover $valueActions': {
            visibility: 'visible',
        },
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.07)',
        },
    },
    valueActions: {
        visibility: 'hidden',
        '@media (max-width:780px)': {
            visibility: 'visible',
        },
    },
    userOptions: {
        height: '100%',
    },
    listItemText: {
        cursor: 'default',
        '@media (max-width:600px)': {
            maxWidth: '120px',
        },
        '@media (max-width:400px)': {
            padding: '0',
        },
    },
    modalContent: {
        position: 'absolute',
        width: '1200px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing(4),
        outline: 'none',
        overflowY: 'auto',
        maxHeight: '100vh',
        '@media (max-width:1300px)': {
            width: '90%',
        },
    },
    loader: {
        height: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsBlock: {
        backgroundColor: blue[50],
        borderRadius: '3px',
        padding: '20px',
    },
    columns: {
        display: 'flex',
        justifyContent: 'space-between',
        height: 'calc(100vh - 200px)', // Set fixed height minus header/search/etc
        overflow: 'hidden',
    },
    userColWrapper: {
        textAlign: 'center',
        overflowY: 'auto',
        height: 'calc(100% - 20%)',
    },

    search: {
        display: 'flex',
        padding: '8px 16px',
    },
    searchIcon: {
        marginRight: '10px',
    },
    searchInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
    },
    success: {
        backgroundColor: theme.palette.success.main,
    },
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
        margin: theme.spacing(1),
    },
});

const mapStateToProps = ({data, application}) => {
    return {
        users: data.users,
        transactions: data.transactions,
        orders: data.orders,
        currentAdmin: application.currentAdmin,
    };
};

const mapDispatchToProps = (dispatch) => ({
    getUsers: (payload) => dispatch(getUsers(payload)),
    deleteUsers: (payload) => dispatch(deleteUsersByIds(payload)),
    editUser: (payload) => dispatch(editUser(payload)),
    assignUser: (managerEmail, userEmail) => dispatch(assignUser(managerEmail, userEmail)),
    detachUser: (userEmail) => dispatch(detachUser(userEmail)),
    editOrder: (payload) => dispatch(editOrder(payload)),
    getOrders: (payload) => dispatch(getOrders(payload)),
    deleteOrders: (payload) => dispatch(deleteOrdersByIds(payload)),
    editTransaction: (payload) => dispatch(editTransaction(payload)),
    getTransactions: (payload) => dispatch(getTransactions(payload)),
    deleteTransactions: (payload) => dispatch(deleteTransactionsByIds(payload)),
});

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DEFAULT_LANG = 'ru';
const DEFAULT_ACTIVE_SERVICE = {name: '', id: ''};

class UsersPage extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        users: PropTypes.array.isRequired,
        getUsers: PropTypes.func.isRequired,
        deleteUsers: PropTypes.func.isRequired,
        editUser: PropTypes.func.isRequired,
        assignUser: PropTypes.func.isRequired,
        detachUser: PropTypes.func.isRequired,
        getOrders: PropTypes.func.isRequired,
        deleteOrders: PropTypes.func.isRequired,
        orders: PropTypes.array,
        getTransactions: PropTypes.func.isRequired,
        deleteTransactions: PropTypes.func.isRequired,
        transactions: PropTypes.array,
        currentAdmin: PropTypes.shape({
            id: PropTypes.string,
            email: PropTypes.string,
            name: PropTypes.string,
            surname: PropTypes.string,
        }),
    };

    static defaultProps = {
        users: [],
        orders: [],
        transactions: [],
        getUsers: noop,
        deleteUsers: noop,
        editUser: noop,
        getOrders: noop,
        getTransactions: noop,
        currentAdmin: null,
    };

    constructor(props) {
        super(props);
        this.updateOrdersAssets = this.updateOrdersAssets.bind(this);
    }

    state = {
        loading: true,
        activeUser: DEFAULT_ACTIVE_SERVICE,
        orderFormShowed: false,
        orderCloseFormShowed: false,
        transactionFormShowed: false,
        userFormShowed: false,
        editableUser: {},
        editableTransaction: {},
        users: [],
        orders: [],
        transaction: [],
        lang: DEFAULT_LANG,
        valueForDelete: null,
        tabsValue: 1,
        formOrdersShowed: false,
        warningFormOrderShowed: false,
        formTransactionsShowed: false,
        warningFormTransactionShowed: false,
        formOrdersCloseShowed: false,
        warningFormOrderCloseShowed: false,
        inputValue: '',
        isClickedSubmit: false,
        showSuccess: false,
        successMessage: '',
        errorText: '',
        newUserEmail: '',
    };

    updateOrdersAssets() {
        const updatedOrders = this.state.orders.map((order) => {
            if (order.isClosed) {
                const asset = CHART_SYMBOL_INFO_MAP[order.assetName];
                const diffPrice =
                    order.diffPrice || formatPrice(order.closedPrice - order.openingPrice);
                const profit = getProfit(
                    order.amount,
                    order.openingPrice,
                    order.closedPrice,
                    order.type,
                    asset
                );
                let finalProfit = order.profitFreeze ? order.profit : profit;
                finalProfit += order.additionalProfit || 0;
                const commission = order.commission || getCommission(order.pledge, COMMISSION);

                return {
                    ...order,
                    diffPrice,
                    profit: finalProfit,
                    commission,
                };
            }

            const asset = CHART_SYMBOL_INFO_MAP[order.assetName];
            const livePrice = assetPriceWebsocketController.prices[order.assetName];

            if (order.amount && order.openingPrice && livePrice && order.type && asset) {
                if (order.profitFreeze) {
                    const diffPrice = formatPrice(order.closedPrice - order.openingPrice);
                    return {
                        ...order,
                        diffPrice,
                    };
                }

                const realPrice =
                    order.type === 'buy' ? calculateBuyingPrice(asset.name, livePrice) : livePrice;

                const profit = getProfit(
                    Number(order.amount),
                    Number(order.openingPrice),
                    realPrice,
                    order.type,
                    asset
                );

                const diffPrice = formatPrice(realPrice - order.openingPrice);

                return {
                    ...order,
                    profit,
                    diffPrice,
                };
            } else {
                return {
                    ...order,
                    profit: '',
                };
            }
        });
        this.setState({orders: updatedOrders});
    }

    componentDidMount() {
        Promise.all([
            this.props.getOrders(),
            this.props.getTransactions(),
            this.props.getUsers(),
        ]).then(() => {
            const filteredUsers = this.filterUsersByManager(this.props.users);
            const firstUser = filteredUsers[0] || DEFAULT_ACTIVE_SERVICE;

            this.setState({
                loading: false,
                users: this.props.users,
                activeUser: firstUser,
                orders: this.getUserOrders(this.props.users[0]),
                transactions: this.getUserTransactions(this.props.users[0]),
            });
            this.updateOrdersAssets();
        });

        assetPriceWebsocketController.events.on('AssetsNames:changed', this.updateOrdersAssets);
    }

    componentWillUnmount() {
        assetPriceWebsocketController.events.off('AssetsNames:changed', this.updateOrdersAssets);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.users !== this.props.users) {
            const filteredUsers = this.filterUsersByManager(this.props.users);
            const currentActiveUser = filteredUsers.find((u) => u.id === this.state.activeUser.id);

            this.setState({
                users: filteredUsers,
                activeUser: currentActiveUser || filteredUsers[0] || DEFAULT_ACTIVE_SERVICE,
                orders: this.getUserOrders(currentActiveUser || filteredUsers[0]),
                transactions: this.getUserTransactions(currentActiveUser || filteredUsers[0]),
            });
        }
    }

    filterUsersByManager = (users) => {
        const {currentAdmin} = this.props;
        if (currentAdmin && currentAdmin.id === 'manager_id') {
            return users.filter((user) => user.manager === currentAdmin.email);
        }
        return users;
    };

    getUserOrders = (activeUser = this.state.activeUser) => {
        const {orders, currentAdmin} = this.props;

        if (!orders.length) return [];

        if (currentAdmin && currentAdmin.id === 'manager_id') {
            return orders.filter((order) => {
                const orderUser = this.props.users.find((u) => u.id === order.userId);
                return (
                    orderUser &&
                    orderUser.manager === currentAdmin.email &&
                    order.userId === activeUser.id
                );
            });
        }

        return orders.filter((order) => order.userId === activeUser.id);
    };

    getUserTransactions = (activeUser = this.state.activeUser) => {
        const {transactions, currentAdmin} = this.props;

        if (!transactions.length) return [];

        // Filter transactions for manager's users only
        if (currentAdmin && currentAdmin.id === 'manager_id') {
            return transactions.filter((transaction) => {
                const transactionUser = this.props.users.find((u) => u.id === transaction.userId);
                return (
                    transactionUser &&
                    transactionUser.manager === currentAdmin.email &&
                    transaction.userId === activeUser.id
                );
            });
        }

        return transactions.filter((transaction) => transaction.userId === activeUser.id);
    };

    handleOrderFormOpen = (order) => () => {
        this.setState({
            orderFormShowed: true,
            editableOrder: order || {},
        });
    };

    handleOrderCloseFormOpen = (order) => () => {
        this.setState({
            orderCloseFormShowed: true,
            editableOrderClose: order || {},
        });
    };

    handleTransactionFormOpen = (transaction) => () => {
        this.setState({
            transactionFormShowed: true,
            editableTransaction: transaction || {},
        });
    };

    handleUserFormOpen = (user) => () => {
        this.setState({
            userFormShowed: true,
            editableUser: user,
        });
    };

    handleUserClone = (user) => () => {
        this.setState({
            userFormShowed: true,
            editableUser: omit(['password'], user),
        });
    };

    handleUserFormDone = () => {
        const {activeUser} = this.state;

        this.props.getUsers().then(() => {
            const {users} = this.props;

            this.setState({
                users: users,
                activeUser: users.find((user) => user.id === activeUser.id) || users[0],
            });
            this.handleCloseUserForm();

            this.props.getOrders().then(() => {
                this.setState({
                    orders: this.getUserOrders(),
                });
            });

            this.props.getTransactions().then(() => {
                this.setState({
                    transactions: this.getUserTransactions(),
                });
            });
        });
    };

    handleOrderFormDone = () => {
        this.props.getOrders().then(() => {
            this.setState({
                orders: this.getUserOrders(),
            });
            this.handleCloseOrderForm();
            this.updateOrdersAssets();
        });
    };

    handleOrderCloseFormDone = () => {
        this.props.getOrders().then(() => {
            this.setState({
                orders: this.getUserOrders(),
            });
            this.handleCloseOrderCloseForm();
        });
    };

    handleTransactionFormDone = () => {
        this.props.getTransactions().then(() => {
            this.setState({
                transactions: this.getUserTransactions(),
                showSuccess: true,
            });
            this.handleCloseTransactionForm();
        });
    };

    handleUserDelete = (user) => () => {
        this.setState({
            valueForDelete: user,
        });
    };

    handleOrderDelete = (order) => {
        return this.props.deleteOrders(order).then(() => {
            this.props.getOrders().then(() => {
                this.setState({
                    orders: this.getUserOrders(),
                });
            });
        });
    };

    handleTransactionDelete = async (transaction) => {
        await new Promise((resolve) => {
            this.setState(
                {
                    activeUser: clone(
                        this.props.users.find((user) => user.id === this.state.activeUser.id)
                    ),
                },
                resolve
            );
        });

        const {activeUser} = this.state;
        this.props
            .deleteTransactions({transaction, user: activeUser})
            .then(() => {
                this.props.getTransactions().then(() => {
                    this.setState({
                        transactions: this.getUserTransactions(),
                    });
                });
            })
            .catch((e) => {
                this.setState({errorText: e.error});
            });
    };

    handleWarningDisagree = () => {
        this.setState({
            valueForDelete: null,
        });
    };

    handleWarningAgree = () => {
        const {valueForDelete, activeUser, users} = this.state;

        this.props.deleteUsers(valueForDelete.id).then(() => {
            this.setState({
                users: this.props.users,
                activeUser: (activeUser === valueForDelete && users[0]) || DEFAULT_ACTIVE_SERVICE,
                valueForDelete: null,
            });
        });
    };

    handleChangeFormOrderClose = (value) => {
        this.setState({
            warningFormOrderShowed: value,
        });
    };

    handleChangeFormOrderCloseClose = (value) => {
        this.setState({
            warningFormOrderCloseShowed: value,
        });
    };

    handleChangeFormTransactionClose = (value) => {
        this.setState({
            warningFormTransactionShowed: value,
        });
    };

    handleCloseOrderForm = () => {
        this.setState({
            orderFormShowed: false,
            warningFormOrderShowed: false,
            editableOrder: null,
        });
    };

    handleCloseOrderCloseForm = () => {
        this.setState({
            orderCloseFormShowed: false,
            warningFormOrderCloseShowed: false,
            editableOrderClose: null,
        });
    };

    handleCloseTransactionForm = () => {
        this.setState({
            transactionFormShowed: false,
            warningFormTransactionShowed: false,
            editableTransaction: null,
            isClickedSubmit: false,
        });
    };

    handleCloseUserForm = () => {
        this.setState({
            userFormShowed: false,
        });
    };

    handleUserClick = (user) => () => {
        this.setState({
            activeUser: user,
            orders: this.getUserOrders(user),
            transactions: this.getUserTransactions(user),
        });
    };

    handleAssignUser = () => {
        const {currentAdmin} = this.props;
        const {newUserEmail} = this.state;

        if (!newUserEmail) {
            this.setState({errorText: 'Email пользователя обязателен'});
            return;
        }

        if (!EMAIL_PATTERN.test(newUserEmail)) {
            this.setState({errorText: 'Введите валидный email'});
            return;
        }

        this.props
            .assignUser(currentAdmin.email, newUserEmail)
            .then(() => {
                this.setState({
                    newUserEmail: '',
                    showSuccess: true,
                    successMessage: 'Пользователь успешно прикреплен',
                });
                this.props.getUsers();
            })
            .catch((error) => {
                this.setState({
                    errorText: error.message || 'Ошибка при добавлении пользователя',
                });
            });
    };

    handleUserDetach = (user) => () => {
        this.props
            .detachUser(user.email)
            .then(() => {
                this.setState({
                    showSuccess: true,
                    successMessage: 'Пользователь успешно откреплен',
                });
                this.props.getUsers();
            })
            .catch((error) => {
                this.setState({
                    errorText: error.message || 'Ошибка при откреплении пользователя',
                });
            });
    };

    onDragEnd = ({oldIndex, newIndex}) => {
        const {users} = this.state;
        const newValues = arrayMove(users, oldIndex, newIndex);

        newValues.forEach((user, i) => {
            user.positionIndex = i;

            this.props.editUser(user);
        });

        this.setState({
            users: newValues,
        });
    };

    renderTable = () => {
        const {classes} = this.props;
        const {
            loading,
            tabsValue,
            users,
            activeUser,
            editableTransaction,
            transactionFormShowed,
            warningFormTransactionShowed,
            editableOrder,
            editableOrderClose,
            orderFormShowed,
            warningFormOrderShowed,
            orderCloseFormShowed,
            warningFormOrderCloseShowed,
            isClickedSubmit,
        } = this.state;

        if (loading) {
            return (
                <div className={classes.loader}>
                    <CircularProgress />
                </div>
            );
        }

        return (
            <div className={classes.container}>
                <AppBar position="static" color="default">
                    <Tabs
                        value={tabsValue}
                        onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                    >
                        <Tab onClick={this.handleTableChange(0)} label="Транзакции" />
                        <Tab onClick={this.handleTableChange(1)} label="Ордера" />
                    </Tabs>
                </AppBar>
                <SwipeableViews index={tabsValue}>
                    {this.renderTabTransactions(0)}
                    {this.renderTabOrders(1)}
                </SwipeableViews>
                <Modal
                    open={orderFormShowed}
                    onClose={() => this.handleChangeFormOrderClose(true)}
                    className={classes.modal}
                >
                    <Paper className={classes.modalContent}>
                        <OrderForm
                            users={users}
                            activeUser={activeUser}
                            order={editableOrder}
                            orders={this.state.orders}
                            onDone={this.handleOrderFormDone}
                        />
                    </Paper>
                </Modal>
                <CloseFormDialog
                    open={orderFormShowed && warningFormOrderShowed}
                    text="Вы точно хотите закрыть форму?"
                    onClose={this.handleChangeFormOrderClose}
                    onDone={this.handleCloseOrderForm}
                />
                <Modal
                    open={orderCloseFormShowed}
                    onClose={() => this.handleChangeFormOrderCloseClose(true)}
                    className={classes.modal}
                >
                    <Paper className={classes.modalContent}>
                        <OrderCloseForm
                            users={users}
                            activeUser={activeUser}
                            order={editableOrderClose}
                            onDone={this.handleOrderCloseFormDone}
                        />
                    </Paper>
                </Modal>
                <CloseFormDialog
                    open={orderCloseFormShowed && warningFormOrderCloseShowed}
                    text="Вы точно хотите закрыть форму?"
                    onClose={this.handleChangeFormOrderCloseClose}
                    onDone={this.handleCloseOrderCloseForm}
                />
                <Modal
                    open={transactionFormShowed}
                    onClose={() => this.handleChangeFormTransactionClose(true)}
                    className={classes.modal}
                >
                    <Paper className={classes.modalContent}>
                        <TransactionForm
                            users={users}
                            activeUser={activeUser}
                            transaction={editableTransaction}
                            isClickedSubmit={isClickedSubmit}
                            onDone={this.handleTransactionFormDone}
                        />
                    </Paper>
                </Modal>
                <CloseFormDialog
                    open={transactionFormShowed && warningFormTransactionShowed}
                    text="Вы точно хотите закрыть форму?"
                    onClose={this.handleChangeFormTransactionClose}
                    onDone={this.handleCloseTransactionForm}
                />
                <ChartChangeForm />
            </div>
        );
    };

    handleTableChange = (event) => () => {
        this.setState({
            tabsValue: event,
        });
    };

    handleSearch = (e) => {
        this.setState({inputValue: e.target.value});
    };

    handleSuccesslMessage = () => {
        this.setState({
            showSuccess: false,
        });
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: '',
        });
    };

    renderTabOrders = () => {
        const {activeUser, orders} = this.state;

        return (
            <div>
                <AdminTable
                    headerRows={headerOrderRows}
                    tableCells={tableOrderCells}
                    values={orders}
                    headerText={`Ордера пользователя "${pathOr(
                        ['name'],
                        '',
                        activeUser
                    )} ${pathOr(['surname'], '', activeUser)}"`}
                    deleteValueWarningTitle="Вы точно хотите удалить ордер?"
                    deleteValuesWarningTitle="Вы точно хотите удалить следующие ордера?"
                    onDelete={this.handleOrderDelete}
                    onFormOpen={this.handleOrderFormOpen}
                    onFormClose={this.handleOrderCloseFormOpen}
                    isAddButton={true}
                    onAdd={this.handleOrderAdd}
                    isClosedButton={true}
                />
            </div>
        );
    };

    renderTabTransactions = () => {
        const {activeUser, transactions} = this.state;

        return (
            <div>
                <AdminTable
                    headerRows={headerTransactionRows}
                    tableCells={tableTransactionCells}
                    values={transactions}
                    headerText={`Транзакции пользователя "${pathOr(
                        ['name'],
                        '',
                        activeUser
                    )} ${pathOr(['surname'], '', activeUser)}"`}
                    deleteValueWarningTitle="Вы точно хотите удалить пользователя?"
                    deleteValuesWarningTitle="Вы точно хотите удалить следующих пользователей?"
                    onDelete={this.handleTransactionDelete}
                    onFormOpen={this.handleTransactionFormOpen}
                />
            </div>
        );
    };

    handleOrderAdd = () => {
        this.setState({
            editableOrder: {},
            orderFormShowed: true,
        });
    };

    render() {
        const {classes, currentAdmin} = this.props;
        const {
            editableUser,
            valueForDelete,
            users,
            lang,
            userFormShowed,
            loading,
            inputValue,
            showSuccess,
            errorText,
        } = this.state;

        if (loading) {
            return (
                <div className={classes.loader}>
                    <CircularProgress />
                </div>
            );
        }

        const filteredByManagerUsers =
            currentAdmin && currentAdmin.id === 'manager_id'
                ? users.filter((user) => user.manager === currentAdmin.email)
                : users;

        const searchFilteredUsers = filteredByManagerUsers.filter((user) => {
            return (
                user.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                user.surname.toLowerCase().includes(inputValue.toLowerCase()) ||
                `${user.name} ${user.surname}`.toLowerCase().includes(inputValue.toLowerCase())
            );
        });

        const activeUsers = (!inputValue ? filteredByManagerUsers : searchFilteredUsers).filter(
            (user) => user.isActive === 'true'
        );
        const inactiveUsers = (!inputValue ? filteredByManagerUsers : searchFilteredUsers).filter(
            (user) => user.isActive === 'false'
        );
        const newUsers = (!inputValue ? filteredByManagerUsers : searchFilteredUsers).filter(
            (user) => user.isActive === 'null'
        );

        return (
            <main className={classes.root}>
                <div className={classes.boom}>{this.renderTable()}</div>
                <Drawer
                    className={classes.drawer}
                    variant="permanent"
                    anchor="right"
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.toolbarNav}>
                        <Typography variant="h6" className={classes.userTitle}>
                            Пользователи
                        </Typography>
                    </div>
                    <Divider />
                    <div className={classes.userTypes}>
                        <div className={classes.addForm}>
                            <input
                                placeholder="Email пользователя"
                                className={classes.addInput}
                                value={this.state.newUserEmail}
                                onChange={(e) => this.setState({newUserEmail: e.target.value})}
                            />
                            <button className={classes.addButton} onClick={this.handleAssignUser}>
                                Прикрепить пользователя
                            </button>
                        </div>
                    </div>
                    <Divider />
                    <div className={classes.userTypes}>
                        <div className={classes.search}>
                            <div className={classes.searchIcon}>
                                <SearchIcon />
                            </div>
                            <input
                                placeholder="Поиск…"
                                className={classes.searchInput}
                                value={inputValue}
                                onChange={this.handleSearch}
                            />
                        </div>
                    </div>
                    <Divider />
                    <div className={classes.toolbar} />
                    <div className={classes.columns}>
                        <div className={classes.userColWrapper} style={classes.coler}>
                            <Typography variant="h6" className={classes.userTitle}>
                                Активные
                            </Typography>
                            <SortableWrapper
                                axis="xy"
                                onFormOpen={this.handleUserFormOpen}
                                onUserDelete={this.handleUserDelete}
                                onUserDetach={this.handleUserDetach}
                                onUserClick={this.handleUserClick}
                                onProductClone={this.handleUserClone}
                                users={activeUsers}
                                lang={lang}
                                classes={classes}
                                isManager={currentAdmin && currentAdmin.id === 'manager_id'}
                            />
                        </div>
                        <div className={classes.userColWrapper}>
                            <Typography variant="h6" className={classes.userTitle}>
                                Неактивные
                            </Typography>
                            <SortableWrapper
                                axis="xy"
                                onFormOpen={this.handleUserFormOpen}
                                onUserDelete={this.handleUserDelete}
                                onUserDetach={this.handleUserDetach}
                                onUserClick={this.handleUserClick}
                                onProductClone={this.handleUserClone}
                                users={inactiveUsers}
                                lang={lang}
                                classes={classes}
                                isManager={currentAdmin && currentAdmin.id === 'manager_id'}
                            />
                        </div>
                        <div className={classes.userColWrapper}>
                            <Typography variant="h6" className={classes.userTitle}>
                                Новые
                            </Typography>
                            <SortableWrapper
                                axis="xy"
                                onFormOpen={this.handleUserFormOpen}
                                onUserDelete={this.handleUserDelete}
                                onUserDetach={this.handleUserDetach}
                                onUserClick={this.handleUserClick}
                                onProductClone={this.handleUserClone}
                                users={newUsers}
                                lang={lang}
                                classes={classes}
                                isManager={currentAdmin && currentAdmin.id === 'manager_id'}
                            />
                        </div>
                    </div>
                </Drawer>
                <Modal
                    open={userFormShowed}
                    onClose={this.handleCloseUserForm}
                    className={classes.modal}
                    disableEnforceFocus
                >
                    <Paper className={classes.modalContent}>
                        <UserForm
                            users={users}
                            user={editableUser}
                            onDone={this.handleUserFormDone}
                        />
                    </Paper>
                </Modal>
                <Dialog open={!!valueForDelete} onClose={this.handleWarningDisagree}>
                    <DialogTitle>Вы точно хотите удалить пользователя?</DialogTitle>
                    <DialogContent className={classes.warningContent}>
                        <DialogContentText>
                            {valueForDelete && valueForDelete.title}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleWarningDisagree} color="primary">
                            Нет
                        </Button>
                        <Button onClick={this.handleWarningAgree} color="primary" autoFocus>
                            Да
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleSuccesslMessage}
                    open={showSuccess}
                    autoHideDuration={3000}
                >
                    <SnackbarContent
                        className={classNames(classes.success, classes.margin)}
                        message={
                            <span id="client-snackbar" className={classes.message}>
                                <CheckCircleIcon
                                    className={classNames(classes.icon, classes.iconVariant)}
                                />
                                {this.state.successMessage || 'Операция успешно сохранена'}
                            </span>
                        }
                    />
                </Snackbar>

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
            </main>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(materialStyles)(UsersPage));

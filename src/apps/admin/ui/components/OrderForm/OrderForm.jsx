import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import getSchema from './orderFormSchema';
import editOrder from '../../../services/editOrder';
import saveOrder from '../../../services/saveOrder';
import Form from '../Form/Form';
import noop from '@tinkoff/utils/function/noop';
import prop from '@tinkoff/utils/object/prop';
import pick from '@tinkoff/utils/object/pick';
import uniqid from 'uniqid';
import format from 'date-fns/format';
import {
    getPledge,
    getOpeningSlotPrice,
    getProfit,
    getClosingPrice,
    getProfitByClosingPrice,
    getLimitProfit,
    getPriceByProfit,
} from '../../../../client/utils/getAssetValues';
import {CHART_SYMBOL_INFO_MAP} from '../../../../../../server/constants/symbols';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import classNames from 'classnames';
import ErrorIcon from '@material-ui/icons/Error';
import Snackbar from '@material-ui/core/Snackbar';
import {withStyles} from '@material-ui/core/styles';
import formatNumberToString from '../../../../client/utils/formatNumberToString';
import assetPriceWebsocketController from '../../../../client/services/client/assetPriceWebsocket';
import calculateBuyingPrice from '../../../../client/utils/calculateBuyPrice';

function clampProfitToMax(formData, asset) {
    if (formData.openingPrice && formData.amount && formData.type) {
        const maxProfit = getLimitProfit(
            formData.openingPrice,
            formData.amount,
            formData.type,
            asset
        );

        if (
            (formData.type === 'buy' && formData.profit < maxProfit) ||
            (formData.type === 'sell' && formData.profit > maxProfit)
        )
            formData.profit = maxProfit;
    }
}

function updateProfit(formData) {
    const asset = CHART_SYMBOL_INFO_MAP[formData.assetName];
    const livePrice = assetPriceWebsocketController.prices[formData.assetName];

    if (formData.amount && formData.openingPrice && livePrice && formData.type && asset) {
        const realPrice =
            formData.type === 'buy' ? calculateBuyingPrice(asset.name, livePrice) : livePrice;

        const profit = getProfit(
            Number(formData.amount),
            Number(formData.openingPrice),
            realPrice,
            formData.type,
            asset
        );

        formData.profit = profit;
        clampProfitToMax(formData, asset);
    }
}

function updateClosedPrice(formData) {
    const asset = CHART_SYMBOL_INFO_MAP[formData.assetName];

    if (formData.openingPrice && formData.profit && formData.amount && formData.type && asset) {
        const closedPrice = getClosingPrice(
            formData.openingPrice,
            formData.profit,
            formData.amount,
            formData.type,
            asset
        );

        formData.closedPrice = closedPrice;
    }
}

function calcProfitBase(formData) {
    const asset = CHART_SYMBOL_INFO_MAP[formData.assetName];
    if (formData.amount && formData.openingPrice && formData.profit && formData.type && asset) {
        const livePrice = getPriceByProfit(
            formData.amount,
            formData.openingPrice,
            formData.profit,
            formData.type,
            asset
        );
        return livePrice;
    }
    return null;
}

const ORDERS_VALUES = ['userId', 'id'];

const materialStyles = (theme) => ({
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    success: {
        backgroundColor: theme.palette.success.main,
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
    errorMessage: {
        color: theme.palette.error.main,
        marginTop: theme.spacing.unit,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    root: {
        position: 'relative',
    },
});

const mapDispatchToProps = (dispatch) => ({
    editOrder: (payload) => dispatch(editOrder(payload)),
    saveOrder: (payload) => dispatch(saveOrder(payload)),
});

class OrderForm extends Component {
    static propTypes = {
        editOrder: PropTypes.func.isRequired,
        saveOrder: PropTypes.func.isRequired,
        onDone: PropTypes.func,
        order: PropTypes.object,
        users: PropTypes.array,
        activeUser: PropTypes.object,
        classes: PropTypes.object,
    };

    static defaultProps = {
        onDone: noop,
        order: {},
        users: [],
        activeUser: {},
    };

    constructor(props) {
        super(props);

        const {order} = this.props;
        this.dirName = order.dirName || uniqid();
        this.isClosed = order.isClosed;

        this.initialValues = {
            assetName: order.assetName || '',
            createdAt: order.createdAt
                ? format(order.createdAt, "yyyy-MM-dd'T'HH:mm")
                : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            openingPrice: order.openingPrice || '',
            amount: order.amount || '',
            pledge: order.pledge || '',
            profit: formatNumberToString(order.profit),
            additionalProfit: formatNumberToString(order.additionalProfit),
            closedPrice: order.closedPrice || '',
            type: order.type && ['buy', 'sell'].includes(order.type) ? order.type : 'buy',
            ...(order.closedAt ? {closedAt: format(order.closedAt, "yyyy-MM-dd'T'HH:mm")} : {}),
            ...pick(ORDERS_VALUES, order),
            takeProfit: order.takeProfit || '',
            stopLoss: order.stopLoss || '',
            profitFreeze: order.profitFreeze ? !!order.profitFreeze : false,
        };

        const asset = CHART_SYMBOL_INFO_MAP[this.initialValues.assetName];

        if (
            asset &&
            this.initialValues.profit &&
            this.initialValues.amount &&
            this.initialValues.openingPrice &&
            this.initialValues.type
        ) {
            const calculatedClosedPrice = getClosingPrice(
                Number(this.initialValues.openingPrice),
                Number(this.initialValues.profit),
                Number(this.initialValues.amount),
                this.initialValues.type,
                asset
            );

            this.initialValues.closedPrice = calculatedClosedPrice;
        }

        this.id = prop('id', order);
        this.state = {
            errorText: '',
            userFormData: {},
            profitBase: null,
            profitInputTimeout: null,
            profitFreeze: {
                checkbox: order.profitFreeze ? !!order.profitFreeze : false,
                userInput: false,
            },
            autoUpdatePrice: true,
        };

        this.updateProfitOnData = this.updateProfitOnData.bind(this);
    }

    getOrderPayload = ({
        assetName,
        createdAt,
        openingPrice,
        amount,
        pledge,
        type,
        closedAt,
        closedPrice,
        profit,
        additionalProfit,
        takeProfit,
        stopLoss,
        profitFreeze,
    }) => {
        const {activeUser} = this.props;
        return {
            assetName,
            createdAt: +new Date(createdAt),
            openingPrice: Number(openingPrice),
            amount: Number(amount),
            pledge: Number(pledge),
            type,
            ...(closedAt ? {closedAt: +new Date(closedAt)} : {}),
            ...(closedPrice ? {closedPrice: Number(closedPrice)} : {}),
            dirName: this.dirName,
            userId: activeUser.id,
            isClosed: this.isClosed || false,
            profit: Number(profit),
            additionalProfit: Number(additionalProfit),
            takeProfit: takeProfit ? Number(takeProfit) : 0,
            stopLoss: stopLoss ? Number(stopLoss) : 0,
            profitFreeze: profitFreeze ? !!profitFreeze : false,
        };
    };

    handleSubmit = async (values) => {
        const orderPayload = this.getOrderPayload(values);
        const {editOrder, saveOrder, onDone} = this.props;

        return new Promise(async (resolve, reject) => {
            try {
                if (this.id) {
                    await editOrder({...orderPayload, id: this.id});
                } else {
                    await saveOrder(orderPayload);
                }
                onDone();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    setProfitFreeze(value) {
        this.setState((prevState) => ({
            profitFreeze: {
                ...prevState.profitFreeze,
                ...value,
            },
        }));
    }

    setProfitFreezeDebouce() {
        this.setProfitFreeze({
            userInput: true,
            // userInput: Number(changeValue) !== 0, // Если надо, чтобы после удалении пользователем значения, возможно было обновление поля
        });
        // Убираем предыдущий timeout (если он есть)
        if (this.state.profitInputTimeout) {
            clearTimeout(this.state.profitInputTimeout);
        }
        // Запускаем новый таймаут для создания debounce обновления поля profit по событиям assetPriceWebsocket
        const timeout = setTimeout(() => {
            this.setProfitFreeze({userInput: false});
        }, 1000);

        this.setState({profitInputTimeout: timeout});
    }

    handleChange = (values, changes) => {
        const changeKey = Object.keys(changes)[0];
        const changeValue = changes[changeKey];

        const updatedFormData = {
            ...values,
            ...this.state.userFormData,
            ...changes,
        };

        const asset = CHART_SYMBOL_INFO_MAP[updatedFormData.assetName];

        console.log(changeKey);

        switch (changeKey) {
            case 'userId':
                const activeUser = this.props.users.find((user) => user.id === changeValue);
                const {lang} = this.state;
                updatedFormData.orderId = activeUser.texts[lang].order[0].id;
                break;

            case 'amount':
                if (asset) {
                    const openingSlotPrice = getOpeningSlotPrice(
                        asset,
                        updatedFormData.openingPrice
                    );
                    updatedFormData.pledge = getPledge(changeValue, openingSlotPrice);
                }
                break;

            case 'openingPrice':
                if (asset && updatedFormData.amount) {
                    const openingSlotPrice = getOpeningSlotPrice(asset, changeValue);
                    updatedFormData.pledge = getPledge(updatedFormData.amount, openingSlotPrice);
                }
                break;

            case 'profit':
                if (
                    asset &&
                    updatedFormData.openingPrice &&
                    updatedFormData.amount &&
                    updatedFormData.type
                ) {
                    this.setProfitFreezeDebouce();
                }
                break;

            case 'profitFreeze':
                if (this.state.profitFreeze.userInput) {
                    this.setProfitFreeze({
                        userInput: false,
                        checkbox: false,
                    });
                    updatedFormData.profitFreeze = false;
                } else {
                    this.setProfitFreeze({
                        checkbox: !this.state.profitFreeze.checkbox,
                    });
                    const nextFreeze = !this.state.profitFreeze.checkbox;
                    updatedFormData.profitFreeze = nextFreeze;
                }
                break;
            case 'autoUpdatePrice':
                this.setState((prevState) => ({
                    autoUpdatePrice: !prevState.autoUpdatePrice,
                }));
                break;

            case 'closedPrice':
                this.setProfitFreeze({
                    userInput: true,
                    // userInput: Number(changeValue) !== 0, // Если надо, чтобы после удалении пользователем значении, возможно было обновление поля
                });

                // Пересчет поля "прибыль"
                if (
                    asset &&
                    updatedFormData.openingPrice &&
                    updatedFormData.amount &&
                    updatedFormData.type
                ) {
                    const profit = getProfitByClosingPrice(
                        updatedFormData.openingPrice,
                        changeValue,
                        updatedFormData.amount,
                        updatedFormData.type,
                        asset
                    );
                    updatedFormData.profit = profit;
                    clampProfitToMax(updatedFormData, asset);
                }
                break;

            case 'type':
                const validTypes = ['buy', 'sell'];
                updatedFormData.type = validTypes.includes(changeValue) ? changeValue : 'buy';
                break;
        }

        // Пересчет поля "прибыль" и "цена закрытия"
        if (['openingPrice', 'profit', 'amount', 'type'].includes(changeKey)) {
            const doUpdateProfit = !['profit', 'type'].includes(changeKey);
            if (doUpdateProfit) updateProfit(updatedFormData);
            else clampProfitToMax(updatedFormData, asset);
            if (changeKey === 'profit') {
                const livePrice = calcProfitBase(updatedFormData);
                this.setState({
                    profitBase: Number.isNaN(livePrice) ? null : livePrice,
                });
            }
            updateClosedPrice(updatedFormData);
        }

        this.setState({
            userFormData: updatedFormData,
        });
    };

    handleInputChange = (e) => {
        const {name, value} = e.target;
        this.handleChange({[name]: value}, {[name]: value});
    };

    handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.target.name === 'profit' || e.target.name === 'closedPrice')) {
            e.preventDefault();
            if (e.target.value === '' || e.target.value === '0') {
                this.setProfitFreeze({userInput: false});
                this.setState({
                    profitBase: null,
                });
                const formData = {
                    ...this.initialValues,
                    ...this.state.userFormData,
                };
                updateProfit(formData);
                updateClosedPrice(formData);
                this.setState({
                    userFormData: formData,
                });
            }
        }
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: '',
        });
    };

    handleClose = () => {
        this.handleHideFailMessage();
    };

    updateProfitOnData(data) {
        // Если обновилась не валюта ордера - не обновляем
        if (data.name !== this.props.order.assetName) return;
        // Учитываем InputDebounce + чекбокс заморозки
        const isFreeze =
            this.state.profitFreeze.checkbox ||
            this.state.profitFreeze.userInput ||
            !this.state.autoUpdatePrice;
        if (isFreeze) return;

        const formData = {
            ...this.initialValues,
            ...this.state.userFormData,
        };

        const asset = CHART_SYMBOL_INFO_MAP[formData.assetName];

        // Если профит ввел пользователь
        if (this.state.profitBase !== null) {
            const {amount, openingPrice, type} = formData;

            const changePrice = data.prevPrice - data.price;
            const changeType = data.changes;

            if (changeType === 'up') {
                const profit = getProfit(
                    amount,
                    openingPrice,
                    this.state.profitBase + changePrice,
                    type,
                    asset
                );
                formData.profit = profit;
            } else if (changeType === 'down') {
                const profit = getProfit(
                    amount,
                    openingPrice,
                    this.state.profitBase - changePrice,
                    type,
                    asset
                );
                formData.profit = profit;
            }
            // Иначе профит самостоятельно высчитывается
        } else {
            updateProfit(formData);
        }

        clampProfitToMax(formData, asset);
        updateClosedPrice(formData);

        this.setState({
            userFormData: formData,
        });
    }

    componentDidMount() {
        assetPriceWebsocketController.events.on('data', this.updateProfitOnData);
    }

    componentWillUnmount() {
        assetPriceWebsocketController.events.off('data', this.updateProfitOnData);
    }

    render() {
        const {classes, activeUser} = this.props;
        const {errorText} = this.state;

        const initialValues = {
            ...this.initialValues,
            balance: activeUser.mainBalance || 0,
            ...this.state.userFormData,
        };

        return (
            <div>
                <Form
                    initialValues={initialValues}
                    schema={getSchema({
                        data: {
                            title: this.id ? 'Редактирование ордера' : 'Добавление ордера',
                            dirName: this.dirName,
                            isClosed: this.isClosed,
                            profitCheckboxProps: {
                                checked:
                                    this.state.profitFreeze.checkbox ||
                                    this.state.profitFreeze.userInput,
                                value:
                                    this.state.profitFreeze.checkbox ||
                                    this.state.profitFreeze.userInput,
                                title: 'Заморозить',
                                name: 'profitFreeze',
                                onChange: this.handleInputChange,
                            },
                            autoUpdatePriceCheckboxProps: {
                                checked: this.state.autoUpdatePrice,
                                value: this.state.autoUpdatePrice,
                                title: 'Автообновление цен',
                                name: 'autoUpdatePrice',
                                onChange: this.handleInputChange,
                            },
                            profitFreeze: this.state.profitFreeze,
                        },
                    })}
                    onChange={this.handleChange}
                    onSubmit={this.handleSubmit}
                    onKeyDown={this.handleKeyDown}
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

export default connect(null, mapDispatchToProps)(withStyles(materialStyles)(OrderForm));

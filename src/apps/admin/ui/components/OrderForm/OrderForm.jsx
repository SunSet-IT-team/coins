import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import getSchema from './orderFormSchema';
import editOrder from '../../../services/editOrder';
import saveOrder from '../../../services/saveOrder';
import Form from '../Form/Form';
import noop from '@tinkoff/utils/function/noop';
import prop from '@tinkoff/utils/object/prop';
import pick from '@tinkoff/utils/object/pick';
import uniqid from 'uniqid';
import format from 'date-fns/format';
import { getPledge, getOpeningSlotPrice } from '../../../../client/utils/getAssetValues';
import { CHART_SYMBOL_INFO_MAP } from '../../../../../../server/constants/symbols';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import classNames from 'classnames';
import ErrorIcon from '@material-ui/icons/Error';
import Snackbar from '@material-ui/core/Snackbar';
import { withStyles } from '@material-ui/core/styles';

const ORDERS_VALUES = ['userId', 'id'];

const materialStyles = theme => ({
    error: {
        backgroundColor: theme.palette.error.dark
    },
    success: {
        backgroundColor: theme.palette.success.main
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
    },
    errorMessage: {
        color: theme.palette.error.main,
        marginTop: theme.spacing.unit,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    root: {
        position: 'relative'
    }
});

const mapDispatchToProps = (dispatch) => ({
    editOrder: payload => dispatch(editOrder(payload)),
    saveOrder: payload => dispatch(saveOrder(payload))
});

class OrderForm extends Component {
    static propTypes = {
        editOrder: PropTypes.func.isRequired,
        saveOrder: PropTypes.func.isRequired,
        onDone: PropTypes.func,
        order: PropTypes.object,
        users: PropTypes.array,
        activeUser: PropTypes.object,
        classes: PropTypes.object
    };

    static defaultProps = {
        onDone: noop,
        order: {},
        users: [],
        activeUser: {}
    };

    constructor (props) {
        super(props);

        const { order } = this.props;
        this.dirName = order.dirName || uniqid();
        this.isClosed = order.isClosed;
        this.initialValues = {
            assetName: order.assetName || '',
            createdAt: order.createdAt ? format(order.createdAt, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            openingPrice: order.openingPrice || '',
            amount: order.amount || '',
            pledge: order.pledge || '',
            type: order.type && ['buy', 'sell'].includes(order.type) ? order.type : 'buy',
            ...(order.closedAt ? { closedAt: format(order.closedAt, "yyyy-MM-dd'T'HH:mm") } : {}),
            ...(order.closedPrice ? { closedPrice: order.closedPrice } : {}),
            ...pick(ORDERS_VALUES, order),
            takeProfit: order.takeProfit || '',
            stopLoss: order.stopLoss || ''
        };
        this.id = prop('id', order);
        this.state = {
            errorText: ''
        };
    }

    getOrderPayload = (
        {
            assetName,
            createdAt,
            openingPrice,
            amount,
            pledge,
            type,
            closedAt,
            closedPrice,
            takeProfit,
            stopLoss
        }) => {
        const { activeUser } = this.props;
        return {
            assetName,
            createdAt: +new Date(createdAt),
            openingPrice: Number(openingPrice),
            amount: Number(amount),
            pledge: Number(pledge),
            type,
            ...(closedAt ? { closedAt: +new Date(closedAt) } : {}),
            ...(closedPrice ? { closedPrice: Number(closedPrice) } : {}),
            dirName: this.dirName,
            userId: activeUser.id,
            isClosed: this.isClosed || false,
            takeProfit: takeProfit ? Number(takeProfit) : 0,
            stopLoss: stopLoss ? Number(stopLoss) : 0
        };
    };

    handleSubmit = async values => {
        const orderPayload = this.getOrderPayload(values);
        const { editOrder, saveOrder, onDone } = this.props;

        return new Promise(async (resolve, reject) => {
            try {
                if (this.id) {
                    await editOrder({ ...orderPayload, id: this.id });
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

    handleChange = (values, changes) => {
        const changeKey = Object.keys(changes)[0];
        const changeValue = changes[changeKey];

        switch (changeKey) {
        case 'userId':
            const activeUser = this.props.users.find(user => user.id === changeValue);
            const { lang } = this.state;

            values.orderId = activeUser.texts[lang].order[0].id;
            break;
        case 'amount':
            const asset = CHART_SYMBOL_INFO_MAP[values.assetName];
            const openingSlotPrice = getOpeningSlotPrice(asset, values.openingPrice);
            const pledge = getPledge(+changeValue, openingSlotPrice);

            values.pledge = pledge;
            break;
        case 'openingPrice':
            if (values.amount) {
                const asset = CHART_SYMBOL_INFO_MAP[values.assetName];
                const openingSlotPrice = getOpeningSlotPrice(asset, changeValue);
                const pledge = getPledge(+values.amount, openingSlotPrice);
                values.pledge = pledge;
            }
            break;
        case 'type':
            const validTypes = ['buy', 'sell'];
            values.type = validTypes.includes(changeValue) ? changeValue : 'buy';
            break;
        }
    };

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.handleChange({ [name]: value }, { [name]: value });
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: ''
        });
    };

    handleClose = () => {
        this.handleHideFailMessage();
    };

    render () {
        const { classes, activeUser } = this.props;
        const { errorText } = this.state;

        const initialValues = {
            ...this.initialValues,
            balance: activeUser.mainBalance || 0
        };

        return <div>
            <Form
                initialValues={initialValues}
                schema={getSchema({
                    data: {
                        title: this.id ? 'Редактирование ордера' : 'Добавление ордера',
                        dirName: this.dirName,
                        isClosed: this.isClosed
                    }
                })}
                onChange={this.handleChange}
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
                            { errorText }
                        </span>
                    }
                />
            </Snackbar>
        </div>;
    }
}

export default connect(null, mapDispatchToProps)(withStyles(materialStyles)(OrderForm));

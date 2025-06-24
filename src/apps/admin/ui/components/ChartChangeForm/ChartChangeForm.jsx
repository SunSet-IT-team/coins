import React, {Component} from 'react';
import Form from '../Form/Form';
import getSchema from './orderFormSchema';
import assetPriceWebsocketController from '../../../../client/services/client/assetPriceWebsocket';
import Typography from '@material-ui/core/Typography';
import {
    CHART_SYMBOL_INFO_MAP,
    CRYPTO_CURRENCIES_SYMBOLS,
} from '../../../../../../server/constants/symbols';
import {withStyles} from '@material-ui/core/styles';

const materialStyles = (theme) => ({
    root: {
        padding: '10px',
    },
});

class ChartChangeForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userFormData: {},
        };

        this.initialValues = {
            assetName: CRYPTO_CURRENCIES_SYMBOLS[0].name,
            currentPrice: assetPriceWebsocketController.prices[CRYPTO_CURRENCIES_SYMBOLS[0].name],
            priceWithOffset:
                assetPriceWebsocketController.prices[CRYPTO_CURRENCIES_SYMBOLS[0].name],
            priceOffset: '',
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePriceUpdate = this.handlePriceUpdate.bind(this);
    }

    componentDidMount() {
        assetPriceWebsocketController.events.on('data', this.handlePriceUpdate);
    }

    componentWillUnmount() {
        assetPriceWebsocketController.events.off('data', this.handlePriceUpdate);
    }

    handlePriceUpdate(data) {
        const assetName = this.state.userFormData.assetName || this.initialValues.assetName;

        if (data.name !== assetName) return;

        const formData = {
            ...this.initialValues,
            ...this.state.userFormData,
        };

        formData.currentPrice = data.price;
        formData.priceWithOffset = data.price + Number(formData.priceOffset);

        this.setState({
            userFormData: formData,
        });
    }

    getOrderPayload = ({assetName, priceOffset}) => {
        return {
            assetName,
            priceOffset,
        };
    };

    handleSubmit = async (values) => {
        const orderPayload = this.getOrderPayload(values);
        // console.log(orderPayload);
        // const {editOrder, saveOrder, onDone} = this.props;

        return new Promise(async (resolve, reject) => {
            try {
                // onDone();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    handleChange = (values, changes) => {
        const changeKey = Object.keys(changes)[0];
        const changeValue = changes[changeKey];

        const updatedFormData = {
            ...values,
            ...this.state.userFormData,
            ...changes,
        };

        const asset = CHART_SYMBOL_INFO_MAP[updatedFormData.assetName];

        switch (changeKey) {
            case 'assetName':
                const currentPrice = assetPriceWebsocketController.prices[changeValue] || '';
                updatedFormData.currentPrice = currentPrice;
                updatedFormData.priceWithOffset =
                    currentPrice + Number(updatedFormData.priceOffset);
                break;

            case 'priceOffset':
                updatedFormData.priceWithOffset =
                    updatedFormData.currentPrice + Number(changeValue);
                break;
        }

        this.setState({
            userFormData: updatedFormData,
        });
    };

    handleInputChange = (e) => {
        const {name, value} = e.target;
        this.handleChange({[name]: value}, {[name]: value});
    };

    render() {
        const {classes} = this.props;
        // console.log(classes);

        const initialValues = {
            ...this.initialValues,
            ...this.state.userFormData,
        };

        return (
            <div className={classes.root}>
                <Typography variant="h6">Изменение графика валют</Typography>
                <Form
                    initialValues={initialValues}
                    schema={getSchema({
                        data: {},
                    })}
                    onChange={this.handleChange}
                    onSubmit={this.handleSubmit}
                />
            </div>
        );
    }
}

export default withStyles(materialStyles)(ChartChangeForm);

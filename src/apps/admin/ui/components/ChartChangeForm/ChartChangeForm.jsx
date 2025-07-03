import React, {Component} from 'react';
import Typography from '@material-ui/core/Typography';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';

import Form from '../Form/Form';
import getSchema from './orderFormSchema';
import assetPriceWebsocketController from '../../../../client/services/client/assetPriceWebsocket';
import saveChartChanges from '../../../services/saveChartChanges';
import {CRYPTO_CURRENCIES_SYMBOLS} from '../../../../../../server/constants/symbols';

const styles = () => ({root: {padding: 10}});
const mapDispatch = (d) => ({saveChartChanges: (p) => d(saveChartChanges(p))});

// Форматируем число в строку с 2 знаками после запятой
const format = (num) => Number(num).toFixed(2);

/**
 * raw = { value (opt), price (opt), offset }
 * возвращает { base, offset } (числа)
 */
const parseRaw = (raw) => {
    if (raw && typeof raw === 'object') {
        const off = Number(raw.offset) || 0;
        const total =
            raw.value !== undefined
                ? Number(raw.value) || 0
                : raw.price !== undefined
                  ? Number(raw.price) || 0
                  : 0;
        return {base: total - off, offset: off};
    }
    const num = Number(raw) || 0;
    return {base: num, offset: 0};
};

const buildForm = ({symbol, base, offset}) => ({
    assetName: symbol,
    currentPrice: format(base),
    priceOffset: format(offset),
    priceWithOffset: format(base + offset),
});

class ChartChangeForm extends Component {
    constructor(props) {
        super(props);
        const symbol = CRYPTO_CURRENCIES_SYMBOLS[0].name;
        const {base, offset} = parseRaw(assetPriceWebsocketController.prices[symbol]);
        this.state = {
            form: buildForm({symbol, base, offset}),
            editing: null,
            touched: new Set(),
            lastSubmit: Date.now(),
        };
    }

    componentDidMount() {
        assetPriceWebsocketController.events.on('data', this.onWsData);
    }
    componentWillUnmount() {
        assetPriceWebsocketController.events.off('data', this.onWsData);
    }

    // WS-апдейт: обновляем currentPrice и нетронутые поля
    onWsData = ({name, price, offset}) => {
        if (name !== this.state.form.assetName) return;

        const {base, offset: off} = parseRaw({price, offset});

        this.setState(({form, editing, touched}) => {
            const next = {...form, currentPrice: format(base)};

            if (editing !== 'priceOffset' && !touched.has('priceOffset')) {
                next.priceOffset = format(off);
            }
            if (editing !== 'priceWithOffset' && !touched.has('priceWithOffset')) {
                next.priceWithOffset = format(base + off);
            }

            return {form: next};
        });
    };

    handleSubmit = async ({assetName, priceOffset}) => {
        const payload = {currency: assetName, offset: Number(priceOffset)};
        const res = await this.props.saveChartChanges(payload);
        this.setState({
            touched: new Set(),
            editing: null,
            lastSubmit: Date.now(),
        });
        return res;
    };

    // Любые изменения из Form
    handleChange = (_all, changes) => {
        const [field] = Object.keys(changes);
        const val = changes[field];

        this.setState(({form, touched}) => {
            const next = {...form, ...changes};

            if (field === 'assetName') {
                const {base, offset} = parseRaw(assetPriceWebsocketController.prices[val]);
                Object.assign(next, buildForm({symbol: val, base, offset}));
                touched = new Set();
            }

            if (field === 'priceOffset') {
                const cp = parseFloat(next.currentPrice);
                next.priceWithOffset = format(cp + Number(val));
            }
            if (field === 'priceWithOffset') {
                const cp = parseFloat(next.currentPrice);
                next.priceOffset = format(Number(val) - cp);
            }

            const newTouched = new Set(touched);
            newTouched.add(field);
            return {form: next, editing: field, touched: newTouched};
        });
    };

    // Фокус/блюр для блокировки WS-перезаписи
    setEditing = (e) => this.setState({editing: e.target.name});
    clearEditing = () => this.setState({editing: null});

    render() {
        const {classes} = this.props;
        const {form, lastSubmit} = this.state;

        return (
            <div className={classes.root}>
                <Typography variant="h6">Изменение графика валют</Typography>
                <Form
                    key={lastSubmit}
                    initialValues={form}
                    schema={getSchema({data: {}})}
                    onChange={this.handleChange}
                    onSubmit={this.handleSubmit}
                    onFocus={this.setEditing}
                    onBlur={this.clearEditing}
                />
            </div>
        );
    }
}

export default connect(null, mapDispatch)(withStyles(styles)(ChartChangeForm));

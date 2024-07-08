import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import styles from './ClosedOrders.css';

import ClosedOrder from '../ClosedOrder/ClosedOrder';

import propOr from '@tinkoff/utils/object/propOr';

import { COMMISSION } from '../../../constants/constants';
import { CHART_SYMBOL_INFO_MAP } from '../../../../../../server/constants/symbols';

import { getProfit, getCommission } from '../../../utils/getAssetValues';
import formatPrice from '../../../utils/formatPrice';
import getClosedOrdersByPage from '../../../services/client/getOrders';

const mapStateToProps = ({ application, data }) => {
    return {
        closedOrders: data.closedOrders,
        langMap: application.langMap
    };
};

const mapDispatchToProps = (dispatch) => ({
    getClosedOrdersByPage: (page, perPage, closedOrders) => dispatch(getClosedOrdersByPage(page, perPage, closedOrders))
});

class ClosedOrders extends Component {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        closedOrders: PropTypes.array.isRequired,
        events: PropTypes.object.isRequired,
        getClosedOrdersByPage: PropTypes.func.isRequired
    };

    state = {
        closedOrders: [],
        page: 1,
        perPage: 10
    };

    componentDidMount () {
        this.setState({
            closedOrders: this.getClosedOrders(this.props.closedOrders)
        });

        this.props.events.on('SCROLL_DOWN_ORDERS_CLOSE', () => {
            this.loadMore();
        });
    }

    componentWillReceiveProps (nextProps, nextContext) {
        if (nextProps.closedOrders !== this.props.closedOrders) {
            this.setState({
                closedOrders: this.getClosedOrders(nextProps.closedOrders)
            });
        }
    }

    getClosedOrders = orders => {
        return orders.map(order => {
            const asset = CHART_SYMBOL_INFO_MAP[order.assetName];
            const diffPrice = formatPrice(order.closedPrice - order.openingPrice);
            const profit = getProfit(order.amount, order.openingPrice, order.closedPrice, order.type, asset);
            const commission = getCommission(order.pledge, COMMISSION);

            return ({
                ...order,
                diffPrice,
                profit,
                commission
            });
        });
    };

    async loadMore () {
        this.state.page += 1;
        this.props.getClosedOrdersByPage(this.state.page, this.state.perPage, this.state.closedOrders);
    }

    render () {
        const { langMap } = this.props;
        const text = propOr('accountInfo', {}, langMap).tradeHistory;
        const {
            closedOrders
        } = this.state;

        return <div className={styles.closePositionInnerContaimer}>

            <div className={styles.footerHeaderTable}>
                <div className={styles.itemNum}>#</div>
                <div className={styles.itemCreateDate}>{text.dateTitle}</div>
                <div className={styles.itemCloseDate}>{text.dateCloseTitle}</div>
                <div className={styles.itemAsset}>{text.assetTitle}</div>
                <div className={styles.itemAmount}>{text.amountTitle}</div>
                <div className={styles.itemPledge}>{text.pledgeTitle}</div>
                <div className={styles.itemOpeningRate}>{text.openingRateTitle}</div>
                <div className={styles.itemClosingRate}>{text.closingRateTitle}</div>
                <div className={styles.itemProfit}>{text.profitTitle}</div>
                <div className={styles.itemCommission}>{text.commissionTitle}</div>
                <div className={styles.profitAndLoss}>{text.takeProfit}</div>
                <div className={styles.profitAndLoss}>{text.stopLoss}</div>
                <div className={styles.itemClosingDate}>{text.closingDate}</div>
            </div>
            <div className={styles.footerRowsContainer}>
                {closedOrders && closedOrders
                    .sort((prev, next) => next.closedAt - prev.closedAt)
                    .map((item, i) => <ClosedOrder key={i} item={item} orderIndex={i}/>)}
            </div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ClosedOrders);

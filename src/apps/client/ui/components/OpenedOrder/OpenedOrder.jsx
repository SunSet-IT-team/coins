import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import classNames from 'classnames';

import format from 'date-fns/format';
import CircularProgress from '@material-ui/core/CircularProgress';
import propOr from '@tinkoff/utils/object/propOr';

import styles from './OpenedOrder.css';

import {CHART_SYMBOL_INFO_MAP} from '../../../../../../server/constants/symbols';
import closeOrder from '../../../services/client/closeOrder';

import formatPriceToString from '../../../utils/formatPriceToString';
import formatNumberToString from '../../../utils/formatNumberToString';
import numeral from 'numeral';
import assetPriceWebsocketController from '../../../services/client/assetPriceWebsocket';

const mapDispatchToProps = (dispatch) => ({
    closeOrder: (payload) => dispatch(closeOrder(payload)),
});

const mapStateToProps = ({application}) => {
    return {
        langMap: application.langMap,
    };
};

class OpenedOrder extends PureComponent {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        item: PropTypes.object.isRequired,
        isLoading: PropTypes.object.isRequired,
        isConfirmDeal: PropTypes.bool.isRequired,
        orderIndex: PropTypes.number.isRequired,
        onClose: PropTypes.func.isRequired,
        onCloseConfirm: PropTypes.func.isRequired,
        onCloseDecline: PropTypes.func.isRequired,
    };

    state = {
        isAssetBlocked: false,
    };

    componentDidMount() {
        this.setState({
            isAssetBlocked: assetPriceWebsocketController.disabledPrices[this.props.item.assetName],
        });
        assetPriceWebsocketController.events.on('switchPrice', this.handleSwitchPrice);
    }

    componentWillUnmount() {
        assetPriceWebsocketController.events.off('switchPrice', this.handleSwitchPrice);
    }

    handleSwitchPrice = ({name, disabled}) => {
        if (this.props.item.assetName !== name || this.state.isAssetBlocked === disabled) return;
        if (disabled) {
            this.props.onCloseDecline();
        }
        this.setState({isAssetBlocked: disabled});
    };

    getDate = (currentDate) => {
        const date = new Date(currentDate);

        return format(date, 'dd.MM.yyyy HH:mm');
    };

    render() {
        const {item, isConfirmDeal, isLoading, orderIndex, langMap} = this.props;
        const text = propOr('openOrder', {}, langMap);
        const {isAssetBlocked} = this.state;

        return (
            <div
                className={classNames(styles.footerItemTable, {
                    [styles.activeItemTable]: isConfirmDeal,
                })}
            >
                <div className={classNames(styles.itemNum, styles.footerItems)}>
                    {orderIndex + 1}
                </div>
                <div className={classNames(styles.itemCreateDate, styles.footerItems)}>
                    {this.getDate(item.createdAt)}
                </div>
                <div className={classNames(styles.itemAsset, styles.footerItems)}>
                    {CHART_SYMBOL_INFO_MAP[item.assetName].imgAlone ? (
                        <div className={styles.assetItemPair}>
                            <img
                                className={styles.imgAlone}
                                src={CHART_SYMBOL_INFO_MAP[item.assetName].imgAlone}
                                alt="asset"
                            />
                        </div>
                    ) : (
                        <div className={styles.assetItemPair}>
                            <img
                                className={styles.imgUpper}
                                src={CHART_SYMBOL_INFO_MAP[item.assetName].imgTop}
                                alt="assets"
                            />
                            <img
                                className={styles.imgLower}
                                src={CHART_SYMBOL_INFO_MAP[item.assetName].imgBottom}
                                alt="assets"
                            />
                        </div>
                    )}
                    {CHART_SYMBOL_INFO_MAP[item.assetName].title}
                    <img
                        className={styles.secondImg}
                        src={
                            item.type === 'buy'
                                ? '/src/apps/client/ui/components/Footer/images/arrowUp.svg'
                                : '/src/apps/client/ui/components/Footer/images/arrowDown.svg'
                        }
                        alt=""
                    />
                </div>
                <div className={classNames(styles.itemAmount, styles.footerItems)}>
                    {formatNumberToString(item.amount)}
                </div>
                <div className={classNames(styles.itemPledge, styles.footerItems)}>
                    $ {formatNumberToString(item.pledge)}
                </div>
                <div className={classNames(styles.itemOpeningRate, styles.footerItems)}>
                    {formatPriceToString(item.openingPrice)}
                </div>
                <div className={classNames(styles.itemClosingRate, styles.footerItems)}>
                    {formatPriceToString(item.currentPrice)}
                    {item.diffPrice && (
                        <div
                            className={classNames(styles.itemDiffRate, {
                                [styles.posValue]: item.diffPrice > 0,
                                [styles.negValue]: item.diffPrice < 0,
                            })}
                        >
                            {item.diffPrice > 0 && '+'}
                            {formatPriceToString(item.diffPrice)}
                        </div>
                    )}
                </div>
                <div
                    className={classNames(styles.itemProfit, styles.footerItems, {
                        // Добавляем стили для профита, если торги на валюту не остановлены
                        ...(!isAssetBlocked
                            ? {
                                  [styles.posValue]: item.profit > 0,
                                  [styles.negValue]: item.profit < 0,
                              }
                            : {}),
                    })}
                >
                    {!isAssetBlocked ? (
                        <div>
                            {item.profit > 0 && '+'}
                            {formatNumberToString(item.profit)}
                        </div>
                    ) : (
                        '-'
                    )}
                </div>
                <div
                    className={classNames(styles.itemCommission, styles.footerItems, {
                        [styles.activeItemCommission]: isConfirmDeal,
                    })}
                >
                    $ {formatNumberToString(item.commission)}
                </div>
                <div className={classNames(styles.profitAndLoss, styles.footerItems)}>
                    {item.takeProfit}
                </div>
                <div className={classNames(styles.profitAndLoss, styles.footerItems)}>
                    {item.stopLoss}
                </div>
                <div
                    className={classNames(styles.itemClosingDate, styles.footerItems, {
                        [styles.activeClosingData]: isConfirmDeal,
                    })}
                >
                    {isConfirmDeal ? (
                        <div className={styles.closeDealButton}>{text.accept}</div>
                    ) : (
                        <button
                            className={styles.closeDealButton}
                            onClick={this.props.onClose}
                            disabled={isAssetBlocked}
                        >
                            {text.closeOrder}
                        </button>
                    )}
                    {isConfirmDeal &&
                        !isLoading.loading && [
                            <div
                                onClick={this.props.onCloseConfirm}
                                className={styles.arrowIcons}
                                key={0}
                            >
                                <img
                                    src="/src/apps/client/ui/components/Footer/images/arrow.svg"
                                    alt=""
                                />
                            </div>,
                            <div
                                onClick={this.props.onCloseDecline}
                                className={styles.arrowIcons}
                                key={1}
                            >
                                <img
                                    src="/src/apps/client/ui/components/Footer/images/close.svg"
                                    alt=""
                                />
                            </div>,
                        ]}
                    {isLoading.loading && isLoading.id === item.id && (
                        <div className={styles.preloader}>
                            <CircularProgress size={26} />
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(OpenedOrder);

import io from 'socket.io-client';
import EventEmitter from 'eventemitter3';
import calcUserOrdersChanges from '../../utils/calcUserOrdersChanges';
import formatPrice from '../../utils/formatPrice';
import {CHART_SYMBOL_INFO_MAP} from '../../../../../server/constants/symbols';
import calculateBuyingPrice from '../../utils/calculateBuyPrice';
import isEmpty from '@tinkoff/utils/is/empty';

const WEBSOCKET_URL =
    process.env.NODE_ENV === 'production'
        ? `wss://coinwalletcapital.ru:8443`
        : 'ws://localhost:8443';

const DISCONNECT_TIMEOUT = 2000;

class AssetPriceWebsocketController {
    events = new EventEmitter();
    prices = {};
    prevPrices = {};
    disabledPrices = {};
    changes = {};
    user = null;
    prevBalance = 0;
    mainBalance = 0;
    balance = 0;
    freeBalance = 0;
    totalPledge = 0;
    totalProfit = 0;
    marginLevel = 0;
    orders = [];
    isConnected = false;
    socket = null;
    // Пробуем флаг для оптимизации
    isAdmin = false;

    setIsAdmin(isAdmin) {
        this.isAdmin = isAdmin;
    }

    setPrices(prices) {
        this.prices = Object.fromEntries(
            prices.data.map((data) => {
                const {name, price, ...priceBody} = data;
                if (priceBody.disabled) {
                    this.disabledPrices[name] = true;
                }

                return [name, price];
            })
        );
    }

    setUser(user, orders) {
        this.user = user;
        this.orders = orders.map((order) => ({
            ...order,
            // Сохраняем значение профита с бэка в другое поле, чтобы избежать проблеммы, когда значение не обновляется,
            // из-за того, что берется всегда старое в функции calcUpdatedOrders (вот тут profit: order.savedProfit || updatedOrder.profit)
            ...(order.profit ? {savedProfit: order.profit} : {}),
        }));

        this.calcUpdatedOrders();
    }

    connect() {
        if (this.socket) return;

        this.socket = io(WEBSOCKET_URL, {transports: ['websocket']});

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.events.emit('status', true);

            // отправка всех текущих цен при подключении
            this.events.emit('allPrices', {...this.prices});

            this.calcUpdatedOrders();
        });

        this.socket.on('message', (changes) => {
            let finalChanges = changes;

            if (this.isAdmin) {
                const itemsMap = new Map();
                changes.forEach((item) => {
                    itemsMap.set(item.name, item);
                });
                finalChanges = Array.from(itemsMap.values());
            }

            for (const data of finalChanges) {
                this.prices[data.name] = data.price;
                this.prevPrices[data.name] = data.prevPrice;
                this.changes[data.name] = data.changes;
                if (this.disabledPrices[data.name] !== data.disabled) {
                    this.disabledPrices[data.name] = data.disabled;
                    this.events.emit('switchPrice', {name: data.name, disabled: data.disabled});
                }
                setTimeout(() => {
                    this.events.emit('data', data);
                }, 0);
            }

            const orderAssetNames = new Set(this.orders.map((order) => order.assetName));
            const hasMatches = finalChanges.some((data) => orderAssetNames.has(data.name));

            this.events.emit('AssetsNames:changed', new Set(finalChanges.map((data) => data.name)));

            if (hasMatches) {
                this.calcUpdatedOrders();
            }
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            setTimeout(() => {
                if (!this.isConnected) {
                    this.events.emit('status', false);
                }
            }, DISCONNECT_TIMEOUT);
        });

        this.socket.on('connect_error', (err) => {
            console.error('[WebSocket] ❌ Connection error:', err.message);
        });
    }

    calcUpdatedOrders(isForceEmit = false) {
        const {user, orders, prices} = this;

        if (isEmpty(user)) return;

        const {ordersInfo, balance} = calcUserOrdersChanges(user, orders, prices);

        const newOrders = orders.map((order) => {
            const asset = CHART_SYMBOL_INFO_MAP[order.assetName];
            const updatedOrder = ordersInfo[order.id];
            const currentPrice = updatedOrder.price;
            const currentPriceReal =
                order.type === 'buy'
                    ? calculateBuyingPrice(asset.name, currentPrice)
                    : currentPrice;
            const diffPrice = formatPrice(currentPriceReal - order.openingPrice);

            return {
                ...order,
                currentPrice: currentPriceReal,
                commission: updatedOrder.commission,
                diffPrice,
                profit: order.savedProfit || updatedOrder.profit,
            };
        });

        const {pledge: totalPledge, profit: totalProfit} = newOrders.reduce(
            (result, order) => ({
                pledge: result.pledge + order.pledge,
                profit: result.profit + order.profit,
                commission: result.commission + order.commission,
            }),
            {pledge: 0, profit: 0, commission: 0}
        );

        this.prevBalance = this.balance;
        this.balance = balance;
        this.mainBalance = user.mainBalance;
        this.totalPledge = totalPledge;
        this.orders = newOrders;
        this.totalProfit = totalProfit;

        // Используем значения из админки, если они установлены, иначе расчетные
        let calculatedFreeBalance = balance - totalPledge;
        let balanceToSend = balance;

        if (user.bonuses > 0) {
            balanceToSend += user.bonuses;
            calculatedFreeBalance += user.bonuses;
            this.mainBalance += user.bonuses;
        }

        if (user.credFacilities > 0) {
            balanceToSend += user.credFacilities;
            calculatedFreeBalance += user.credFacilities;
            this.mainBalance += user.credFacilities;
        }

        this.balance = balanceToSend;

        // Приоритет админским значениям над расчетными
        this.freeBalance =
            user.adminFreeBalance !== undefined && user.adminFreeBalance !== null
                ? user.adminFreeBalance
                : calculatedFreeBalance;

        this.marginLevel =
            user.adminMarginLevel !== undefined && user.adminMarginLevel !== null
                ? user.adminMarginLevel
                : Number.isFinite((calculatedFreeBalance / totalPledge) * 100)
                  ? (calculatedFreeBalance / totalPledge) * 100
                  : 0;

        if (this.prevBalance !== this.balance || isForceEmit) {
            this.events.emit('ordersAndBalance', {
                mainBalance: this.mainBalance,
                balance: balanceToSend,
                freeBalance: this.freeBalance,
                orders: newOrders,
                totalPledge,
                totalProfit,
                marginLevel: Number.isFinite(this.marginLevel) ? this.marginLevel : 0,
                bonuses:
                    user.adminBonuses !== undefined && user.adminBonuses !== null
                        ? user.adminBonuses
                        : user.bonuses,
                credFacilities:
                    user.adminCredFacilities !== undefined && user.adminCredFacilities !== null
                        ? user.adminCredFacilities
                        : user.credFacilities,
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const assetPriceWebsocketController = new AssetPriceWebsocketController();

export default assetPriceWebsocketController;

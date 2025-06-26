import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';
import {pricesEvents} from './pricesController';

export class HeartbeatManager {
    constructor(prices, prevPrices) {
        this.prices = prices;
        this.prevPrices = prevPrices;
        this.lastUpdateMap = {};
    }

    start() {
        pricesEvents.on(SYMBOL_PRICE_CHANGE_EVENT, ({assetPriceChange}) => {
            this.lastUpdateMap[assetPriceChange.name] = assetPriceChange.time;
        });

        setInterval(() => {
            const now = Date.now();
            Object.entries(this.prices).forEach(([symbolName, price]) => {
                const lastUpdate = this.lastUpdateMap[symbolName] || 0;
                if (now - lastUpdate >= 5000) {
                    pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
                        prices: this.prices,
                        assetPriceChange: {
                            name: symbolName,
                            price,
                            time: now,
                            changes: 'same',
                            prevPrice: this.prevPrices[symbolName] || price,
                        },
                    });
                    this.lastUpdateMap[symbolName] = now;
                }
            });
        }, 1000);
    }
}

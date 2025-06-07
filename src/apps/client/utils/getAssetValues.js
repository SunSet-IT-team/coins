export const getOpeningSlotPrice = (asset, openingPrice) =>
  openingPrice / asset.leverage
export const getPledge = (amount, openingSlotPrice) => amount * openingSlotPrice
export const getProfit = (amount, openingPrice, price, type, asset) =>
  (type === "buy" ? price - openingPrice : openingPrice - price) * amount
/**
 * Получение цены прибыли, при которой цена закрытия = 0
 */
export const getMaxProfit = (openingPrice, amount, type, asset) => {
  return getProfitByClosingPrice(openingPrice, 0, amount, type, asset)
}
export const getClosingPrice = (
  openingPrice,
  targetProfit,
  amount,
  type,
  asset
) => {
  openingPrice = Number(openingPrice)
  targetProfit = Number(targetProfit)
  amount = Number(amount)
  if (amount === 0) return NaN
  if (type === "buy") {
    return openingPrice + targetProfit / amount
  } else {
    return openingPrice - targetProfit / amount
  }
}
export const getProfitByClosingPrice = (
  openingPrice,
  closingPrice,
  amount,
  type,
  asset
) => {
  openingPrice = Number(openingPrice)
  closingPrice = Number(closingPrice)
  amount = Number(amount)
  if (type === "buy") {
    return amount * (closingPrice - openingPrice)
  } else {
    return amount * (openingPrice - closingPrice)
  }
}
export const getBalance = (balance, profit, commissionValue) =>
  balance + profit - commissionValue
export const getFreeBalance = (balance, pledge) => balance - pledge
export const getCommission = (pledge, commission) => pledge * commission

export default (
  asset,
  { openingPrice, amount, type },
  price,
  balance,
  commission
) => {
  const openingSlotPrice = getOpeningSlotPrice(asset, openingPrice)
  const pledge = getPledge(amount, openingSlotPrice)
  const profit = getProfit(amount, openingPrice, price, type, asset)
  const commissionValue = getCommission(pledge, commission)
  const newBalance = getBalance(balance, profit, commissionValue)
  const freeBalance = getFreeBalance(balance, pledge)

  return {
    openingSlotPrice,
    commissionValue,
    balance: newBalance,
    freeBalance,
    pledge,
    profit,
  }
}

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { SUBSCRIPTION_PERIOD, PERIOD_TO_MONTHS } from '@condo/domains/subscription/constants'


export type PlanPeriod = typeof SUBSCRIPTION_PERIOD.MONTH | typeof SUBSCRIPTION_PERIOD.YEAR

export type PlanPrice = {
    id: string
    name: string
    period: string
    price?: string | null
    currencyCode?: string | null
}

export type PlanDiscount = {
    /** What the same period would cost when paid month by month */
    fullAmount: number
    /** What the client actually pays */
    amount: number
    /** fullAmount - amount, always > 0 */
    discountAmount: number
    discountPercent: number
}

export const getPriceForPeriod = (prices: ReadonlyArray<PlanPrice>, period: PlanPeriod): PlanPrice | null =>
    prices?.find(price => price?.period === period) ?? null

/** Pricing rules with an empty price require a manual offer instead of a checkout */
export const isCustomPrice = (price?: PlanPrice | null): boolean =>
    !price || price.price === null || price.price === undefined

export const getAmount = (price?: PlanPrice | null): number | null =>
    isCustomPrice(price) ? null : Math.floor(Number(price.price))

export const formatAmount = (amount: number | null | undefined, currencyCode: string | null | undefined, locale: string): string => {
    if (amount === null || amount === undefined || Number.isNaN(amount)) return ''
    const formattedAmount = Math.floor(amount).toLocaleString(locale).replace(/,/g, ' ')
    const symbol = currencyCode ? CURRENCY_SYMBOLS[currencyCode] : null

    return symbol ? `${formattedAmount} ${symbol}` : `${formattedAmount} ${currencyCode ?? ''}`.trim()
}

/**
 * Pricing rules store only the final price, so there is no "old price" to strike through.
 * Designs show the yearly saving against paying month by month, which is exactly
 * the monthly rule times 12 minus the yearly rule. Monthly prices have nothing to compare
 * against and therefore carry no discount.
 */
export const getDiscount = (prices: ReadonlyArray<PlanPrice>, period: PlanPeriod): PlanDiscount | null => {
    if (period !== SUBSCRIPTION_PERIOD.YEAR) return null

    const yearPrice = getPriceForPeriod(prices, SUBSCRIPTION_PERIOD.YEAR)
    const monthPrice = getPriceForPeriod(prices, SUBSCRIPTION_PERIOD.MONTH)

    const amount = getAmount(yearPrice)
    const monthAmount = getAmount(monthPrice)
    if (amount === null || monthAmount === null) return null
    if (yearPrice.currencyCode !== monthPrice.currencyCode) return null

    const fullAmount = monthAmount * PERIOD_TO_MONTHS[SUBSCRIPTION_PERIOD.YEAR]
    const discountAmount = fullAmount - amount
    if (discountAmount <= 0) return null

    return {
        fullAmount,
        amount,
        discountAmount,
        discountPercent: Math.round((discountAmount / fullAmount) * 100),
    }
}

/**
 * Percent shown on the year/month switch. Taken as the best saving across plans so that
 * the badge never promises more than any single plan actually gives.
 */
export const getMaxDiscountPercent = (allPrices: ReadonlyArray<ReadonlyArray<PlanPrice>>): number | null => {
    const percents = allPrices
        .map(prices => getDiscount(prices, SUBSCRIPTION_PERIOD.YEAR)?.discountPercent)
        .filter((percent): percent is number => typeof percent === 'number' && percent > 0)

    return percents.length > 0 ? Math.max(...percents) : null
}

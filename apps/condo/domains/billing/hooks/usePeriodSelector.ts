import { useRouter } from 'next/router'
import { parseQuery } from '../../common/utils/tables.utils'
import { useRef } from 'react'
import { useIntl } from '@core/next/intl'
const { getPeriodMessage, getPreviousPeriods } = require('@condo/domains/billing/utils/period')
import get from 'lodash/get'
import qs from 'qs'

type PeriodOption = {
    period: string,
    title: string
}
type UsePeriodSelectorReturnType = [string, Array<PeriodOption>, (string) => void]

const PERIODS_AMOUNT = 3
const generatePeriods = (currentPeriod: string, amount: number, locale: string): Array<PeriodOption> => {
    if (!currentPeriod) return []
    return getPreviousPeriods(currentPeriod, PERIODS_AMOUNT).map((period) => {
        return { period: period, title: getPeriodMessage(period, locale) }
    })
}

export const usePeriodSelector = (lastPeriod: string, amount: number = PERIODS_AMOUNT): UsePeriodSelectorReturnType => {
    const intl = useIntl()
    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const period = useRef(lastPeriod)
    const options = generatePeriods(lastPeriod, amount, intl.locale)
    const availablePeriods = options.map((option) => option.period)
    const filterPeriod = get(filters, 'period', null)

    const handleChange = (newPeriod: string) => {
        let periodToSet = lastPeriod
        if (availablePeriods.includes(newPeriod)) {
            periodToSet = newPeriod
        }
        if (periodToSet !== period.current) {
            period.current = periodToSet
            if (periodToSet === lastPeriod && filterPeriod) {
                delete filters['period']
                const query = { ...router.query, filters: JSON.stringify(filters) }
                const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
                router.push(router.route + newQuery)
            } else if (periodToSet !== lastPeriod) {
                const newFilters = { ...filters, period: periodToSet }
                const query = {
                    ...router.query,
                    filters: JSON.stringify(newFilters),
                }
                const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
                router.push(router.route + newQuery)
            }
        }
    }
    if (filterPeriod !== period.current) {
        handleChange(filterPeriod)
    }

    return [period.current, options, handleChange]
}
import { useIntl } from '@core/next/intl'

export const t = (id:string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const intl = useIntl()
    return intl.formatMessage({ id })
}

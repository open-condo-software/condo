import { ServiceSubscription, SortServiceSubscriptionsBy } from '../../../schema'
import { useOrganization } from '../../../../../packages/@core.next/organization'
import { useObjects } from '../utils/clientSchema/ServiceSubscription'
import dayjs from 'dayjs'
import { get } from 'lodash'
import { isExpired } from '../utils/helpers'

interface IUseSubscriptionHookResult {
    subscription?: ServiceSubscription
    daysLeft?: number
    daysLeftHumanized?: string
    isExpired?: boolean
}

export const useServiceSubscription = (): IUseSubscriptionHookResult => {
    const { organization } = useOrganization()
    const { objs } = useObjects({
        where: {
            organization: { id: get(organization, 'id') },
        },
        sortBy: [SortServiceSubscriptionsBy.StartAtDesc],
    }, {
        fetchPolicy: 'network-only',
    })
    const subscription = objs[0]
    if (!subscription) {
        return {}
    }
    const daysLeftDuration = dayjs.duration(dayjs(subscription.finishAt).diff(dayjs()))
    const daysLeft = Math.ceil(daysLeftDuration.asDays())
    const daysLeftHumanized = daysLeftDuration.humanize()
    return {
        subscription,
        daysLeft,
        daysLeftHumanized,
        isExpired: isExpired(subscription),
    }
}
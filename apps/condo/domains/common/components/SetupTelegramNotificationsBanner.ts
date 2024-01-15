import cookie from 'js-cookie'
import get from 'lodash/get'
import isInteger from 'lodash/isInteger'
import { useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { SHOW_TELEGRAM_NOTIFICATIONS_BANNER, MAX_EMPLOYEE_SIZE_IN_ORGANIZATION_TO_TELEGRAM_NOTIFICATIONS } from '@condo/domains/common/constants/featureflags'
import { TelegramUserChat } from '@condo/domains/notification/utils/clientSchema'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

// By default, we use the value 0 so that if there is no feature flag, the banner will not be allowed to be displayed
const DEFAULT_MAX_EMPLOYEE_SIZE = 0

export const SetupTelegramNotificationsBanner = () => {
    const { organization } = useOrganization()
    const { user } = useAuth()
    const organizationId = get(organization, 'id')
    const userId = get(user, 'id')

    const { useFlag, useFlagValue } = useFeatureFlags()
    const forceShowBanner = useFlag(SHOW_TELEGRAM_NOTIFICATIONS_BANNER) || false
    const maxEmployeeSizeFromFeatureFlag = useFlagValue(MAX_EMPLOYEE_SIZE_IN_ORGANIZATION_TO_TELEGRAM_NOTIFICATIONS)
    const maxEmployeeSize = isInteger(maxEmployeeSizeFromFeatureFlag) ? maxEmployeeSizeFromFeatureFlag : DEFAULT_MAX_EMPLOYEE_SIZE

    const { count: employeeCount, loading: employeeLoading } = OrganizationEmployee.useCount({
        where: {
            organization: { id: organizationId },
            deletedAt: null,
            isRejected: false,
        },
    }, {
        skip: forceShowBanner || !organizationId,
    })

    const { count: telegramUserChatCount, loading: telegramUserChatLoading } = TelegramUserChat.useCount({
        where: {
            user: { id: userId },
            deletedAt: null,
        },
    }, {
        skip: forceShowBanner || !userId,
    })

    const hasTelegramUserChat = telegramUserChatCount && telegramUserChatCount > 0
    const hasAllowedNumberOfEmployees = employeeCount && employeeCount > 0 && employeeCount <= maxEmployeeSize
    const hasPersonalData = !!userId && !!organizationId
    const loading = employeeLoading || telegramUserChatLoading

    const canShowBanner = !loading && hasPersonalData && !hasTelegramUserChat && (forceShowBanner || hasAllowedNumberOfEmployees)

    useEffect(() => {
        cookie.set('canShowBannerWithTgNotifications', !!canShowBanner)
    }, [canShowBanner])

    return null
}

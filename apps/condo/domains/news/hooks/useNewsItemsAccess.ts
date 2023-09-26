import get from 'lodash/get'

import { useOrganization } from '@open-condo/next/organization'

type TUseNewsItemsAccess = {
    canRead: boolean,
    canManage: boolean,
    isLoading: boolean,
}

export const useNewsItemsAccess = (): TUseNewsItemsAccess => {
    const { link: organizationLink, isLoading } = useOrganization()

    const canManage = get(organizationLink, ['role', 'canManageNewsItems'], false)

    // const roleNameRaw = get(organizationLink, ['role', 'nameNonLocalized'])
    // The dispatcher is the only one role who can read and can't manage
    const canRead = get(organizationLink, ['role', 'canReadNewsItems'], false)

    return { canRead, canManage, isLoading }
}

import get from 'lodash/get'
import { useEffect, useState } from 'react'


import { ContactRole } from '@condo/domains/contact/utils/clientSchema'

import { useOrganization } from '@/domains/common/utils/next/organization'

type UseExistingContactRoles = () => Set<string>

export const useExistingContactRoles: UseExistingContactRoles = () => {
    const [existingContactRoles, setExistingContactRoles] = useState<Set<string>>()

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)

    const { objs: contactRoles, loading } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: organizationId } },
            ],
        },
    })

    useEffect(() => {
        const roles = contactRoles.map(role => role.name.trim())
        setExistingContactRoles(new Set(roles))
    }, [loading])

    return existingContactRoles
}
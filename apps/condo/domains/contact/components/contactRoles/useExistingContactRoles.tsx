import { useEffect, useState } from 'react'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'

type UseExistingContactRoles = () => Set<string>

export const useExistingContactRoles: UseExistingContactRoles = () => {
    const [existingContactRoles, setExistingContactRoles] = useState<Set<string>>()

    const { objs: contactRoles, loading } = ContactRole.useObjects({})

    useEffect(() => {
        const roles = contactRoles.map(role => role.name.trim())
        setExistingContactRoles(new Set(roles))
    }, [loading])

    return existingContactRoles
}
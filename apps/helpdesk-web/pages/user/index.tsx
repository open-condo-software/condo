import { UserInfoPageContent } from '@app/condo/pages/user'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { PageComponentType } from '@helpdesk-web/domains/common/types'


const useAllOrganizationEmployee = () => {
    const { user } = useAuth()
    const userId = useMemo(() => get(user, 'id', null), [user])

    return OrganizationEmployee.useAllObjects({
        where: {
            user: { id: userId },
            isAccepted: true,
        },
    }, { skip: !userId })
}

const UserInfoPage: PageComponentType = () => {
    return (
        <UserInfoPageContent useAllOrganizationEmployee={useAllOrganizationEmployee} />
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage

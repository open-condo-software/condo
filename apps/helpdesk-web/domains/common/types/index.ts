import type { AuthenticatedUserQueryResult } from '@app/condo/gql'
import type { GetActiveOrganizationEmployeeQueryResult } from '@app/helpdesk-web/gql'
import type { GetPrefetchedData } from '@condo/domains/common/utils/next/types'
import type { NextPageContext } from 'next'
import type { FC } from 'react'


type UserType = AuthenticatedUserQueryResult['data']['authenticatedUser'] | null
type ActiveEmployeeType = GetActiveOrganizationEmployeeQueryResult['data']['employees'][number] | null
export type PageComponentType <Props = Record<string, never>> = FC<Props> & {
    isError?: boolean
    container?: React.FC
    headerAction?: JSX.Element
    requiredAccess?: FC
    skipUserPrefetch?: boolean
    skipRedirectToAuth?: boolean
    getPrefetchedData?: GetPrefetchedData<UserType, ActiveEmployeeType>
    getInitialProps?: (context: NextPageContext) => Promise<Record<string, any>>
}

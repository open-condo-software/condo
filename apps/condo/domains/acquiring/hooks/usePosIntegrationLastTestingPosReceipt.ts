import { useGetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


export interface LastTestingPosReceiptData {
    id: string
    condoPaymentId: string
}

export interface UsePosIntegrationLastTestingPosReceiptOptions {
    skipUntilAuthenticated?: boolean
}

/**
 * Hook to fetch the last testing POS receipt data.
 * Returns the POS receipt only if the system is in testing mode (i.e., when a B2B app context
 * with POS integration configuration is active and finished).
 * 
 * @param options.skipUntilAuthenticated - If true, delays fetching until authentication is complete (IFrame loaded)
 */
export function usePosIntegrationLastTestingPosReceipt (options?: UsePosIntegrationLastTestingPosReceiptOptions) {
    const { skipUntilAuthenticated = false } = options || {}
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [lastTestingPosReceipt, setLastTestingPosReceipt] = useState<LastTestingPosReceiptData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const {
        loading: areB2bAppContextsLoading,
        data: b2bAppContextsResult,
    } = useGetB2BAppContextWithPosIntegrationConfigQuery(
        {
            variables: { organizationId: organization.id },
            skip: !organization?.id,
        },
    )

    const b2bAppContext = b2bAppContextsResult?.contexts?.[0]
    const baseUrl = b2bAppContext?.app?.posIntegrationConfig?.fetchLastPosReceiptUrl

    const fetchLastTestingPosReceipt = useCallback(async () => {
        if (!baseUrl) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const requestUrl = new URL(baseUrl)

            if (user?.id) {
                requestUrl.searchParams.set('condoUserId', user.id)
            }

            if (organization?.id) {
                requestUrl.searchParams.set('condoOrganizationId', organization.id)
            }

            const response = await fetch(requestUrl.toString(), {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                console.error('Failed to fetch last receipt:', response.statusText)
                setLastTestingPosReceipt(null)
                return
            }

            const data: LastTestingPosReceiptData | null = await response.json()
            setLastTestingPosReceipt(data)
        } catch (error) {
            console.error('Error fetching last receipt:', error)
            setLastTestingPosReceipt(null)
        } finally {
            setLoading(false)
        }
    }, [baseUrl, organization?.id, user?.id])

    useEffect(() => {
        if (!areB2bAppContextsLoading && organization?.id && !skipUntilAuthenticated) {
            fetchLastTestingPosReceipt()
        }
    }, [areB2bAppContextsLoading, organization?.id, skipUntilAuthenticated, fetchLastTestingPosReceipt])

    return {
        b2bAppContext,
        lastTestingPosReceipt,
        loading: areB2bAppContextsLoading || loading,
        refetch: fetchLastTestingPosReceipt,
    }
}

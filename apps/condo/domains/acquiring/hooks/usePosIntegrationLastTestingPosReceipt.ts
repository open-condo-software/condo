import { useGetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import { useCallback, useEffect, useState } from 'react'

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

    const baseUrl = b2bAppContextsResult?.contexts?.[0]?.app?.posIntegrationConfig?.fetchLastPosReceiptUrl

    const fetchLastTestingPosReceipt = useCallback(async () => {
        if (!baseUrl) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(baseUrl, {
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
    }, [baseUrl])

    useEffect(() => {
        if (!areB2bAppContextsLoading && organization?.id && !skipUntilAuthenticated) {
            fetchLastTestingPosReceipt()
        }
    }, [areB2bAppContextsLoading, organization?.id, skipUntilAuthenticated, fetchLastTestingPosReceipt])

    return {
        lastTestingPosReceipt,
        loading: areB2bAppContextsLoading || loading,
        refetch: fetchLastTestingPosReceipt,
    }
}

import { B2BAppContextStatusType } from '@app/condo/schema'
import { useCallback, useEffect, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

interface PaymentReceiptData {
    id: string
    condoPaymentId: string
}

export function usePosIntegrationLastPosReceipt () {
    const { organization } = useOrganization()
    const [lastReceipt, setLastReceipt] = useState<PaymentReceiptData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const {
        loading: areB2bAppContextsLoading,
        objs: b2bAppContexts,
    } = B2BAppContext.useObjects({
        where: {
            status: B2BAppContextStatusType.Finished,
            organization: { id: organization.id },
            app: { posIntegrationConfig_is_null: false, deletedAt: null },
            deletedAt: null,
        },
    }, { skip: !organization?.id })

    const baseUrl = b2bAppContexts?.[0]?.app?.posIntegrationConfig?.fetchLastPosReceiptUrl

    const fetchLastReceipt = useCallback(async () => {
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
                setLastReceipt(null)
                return
            }

            const data: PaymentReceiptData | null = await response.json()
            setLastReceipt(data)
        } catch (error) {
            console.error('Error fetching last receipt:', error)
            setLastReceipt(null)
        } finally {
            setLoading(false)
        }
    }, [baseUrl])

    useEffect(() => {
        if (!areB2bAppContextsLoading && organization?.id) {
            fetchLastReceipt()
        }
    }, [areB2bAppContextsLoading, organization?.id, fetchLastReceipt])

    return {
        lastReceipt,
        loading: areB2bAppContextsLoading || loading,
        refetch: fetchLastReceipt,
    }
}

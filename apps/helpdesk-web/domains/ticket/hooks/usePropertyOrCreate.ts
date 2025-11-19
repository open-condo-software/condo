import { Property as PropertyType, AddressMetaFieldInput, PropertyTypeType } from '@app/condo/schema'
import { useCallback, useEffect, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { Property } from '@condo/domains/property/utils/clientSchema'

interface UsePropertyOrCreateResult {
    property: PropertyType | null
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

/**
 * Creates a minimal addressMeta structure required for Property creation
 */
const createMinimalAddressMeta = (address: string): AddressMetaFieldInput => {
    return {
        dv: 1,
        value: address,
        unrestricted_value: address,
        data: {
            country: 'Россия',
            region: 'Москва',
        },
    }
}

/**
 * Hook that fetches the first property for the current organization.
 * If no property exists, creates a minimal property with required fields.
 *
 * @returns {UsePropertyOrCreateResult} Object containing property, loading state, error, and refetch function
 */
export const usePropertyOrCreate = (): UsePropertyOrCreateResult => {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const [property, setProperty] = useState<PropertyType | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    const { objs: properties, loading: propertiesLoading, refetch: refetchProperties } = Property.useObjects({
        where: {
            organization: { id: organizationId },
        },
        first: 1,
    }, {
        skip: !organizationId,
    })

    const createProperty = Property.useCreate({})

    const fetchOrCreateProperty = useCallback(async () => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Refetch to get the latest data
            const { data } = await refetchProperties()
            const existingProperties = data?.objs ?? []

            if (existingProperties.length > 0) {
                setProperty(existingProperties[0])
            } else {
                // Create minimal property if none exists
                const defaultAddress = 'г Екатеринбург, ул Чапаева, д 79'
                const newProperty = await createProperty({
                    name: defaultAddress,
                    organization: { connect: { id: organizationId } },
                    type: PropertyTypeType.Building,
                    address: defaultAddress,
                    addressMeta: createMinimalAddressMeta(defaultAddress),
                })

                const { data } = await refetchProperties()
                const existingProperties = data?.objs ?? []

                setProperty(existingProperties[0])
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch or create property'))
        } finally {
            setLoading(false)
        }
    }, [organizationId, refetchProperties, createProperty])

    useEffect(() => {
        if (!propertiesLoading && organizationId) {
            if (properties && properties.length > 0) {
                setProperty(properties[0])
                setLoading(false)
            } else {
                fetchOrCreateProperty()
            }
        }
    }, [properties, propertiesLoading, organizationId, fetchOrCreateProperty])

    return {
        property,
        loading: loading || propertiesLoading,
        error,
        refetch: fetchOrCreateProperty,
    }
}

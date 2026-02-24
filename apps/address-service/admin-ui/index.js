import { useMutation, useQuery, gql } from '@apollo/client'
import Logo from '@app/address-service/admin-ui/logo'
import { ItemId, AddNewItem } from '@open-keystone/app-admin-ui/components'
import React, { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { Download, Link } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Space } from '@open-condo/ui'
import '@open-condo/ui/dist/styles.min.css'

const TARGET_URL_PART = 'addresses'

const GET_ADDRESS_QUERY = gql`
    query getAddress ($id: ID!) {
        address: Address(where: { id: $id }) { id possibleDuplicateOf { id address } }
    }
`

const RESOLVE_ADDRESS_DUPLICATE_MUTATION = gql`
    mutation resolveAddressDuplicate ($data: ResolveAddressDuplicateInput!) {
        result: resolveAddressDuplicate(data: $data) { status }
    }
`

const ACTUALIZE_ADDRESSES_MUTATION = gql`
    mutation actualizeAddresses ($data: ActualizeAddressesInput!) {
        result: actualizeAddresses(data: $data) { successIds failures { addressId errorMessage } }
    }
`

function extractErrorMessage (error, fallbackMessage) {
    return error?.graphQLErrors?.[0]?.extensions?.message ||
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        fallbackMessage
}

const UpdateAddress = (props) => {
    const location = useLocation()
    const [actualizeAddress] = useMutation(ACTUALIZE_ADDRESSES_MUTATION)
    const onClick = useCallback(() => {
        // eslint-disable-next-line no-restricted-globals
        const confirmed = confirm(
            'Actualize this address?\n\n' +
            'This will re-fetch the address data from the suggestion provider, ' +
            'update the address key, meta, and heuristics, and reload the page.'
        )
        if (!confirmed) return

        const sender = getClientSideSenderInfo()
        const path = location.pathname.split('/').splice(2, 2)
        const addressId = (path[0] === TARGET_URL_PART && path[1]) ? path[1] : null
        if (!addressId) {
            alert('Cannot detect address id from current URL')
            return
        }

        const data = { dv: 1, sender, addresses: [{ id: addressId }] }
        actualizeAddress({ variables: { data } })
            .then(({ data }) => {
                const result = data?.result
                if (!result) {
                    alert('Actualize failed: empty response')
                    return
                }

                const { successIds, failures } = result
                if (successIds.includes(addressId)) {
                    console.log('✅ Address actualized')
                    window.location.reload()
                } else {
                    const failure = failures.find((failure) => failure.addressId === addressId)
                    if (failure) {
                        console.warn(`⚠️ ${failure.errorMessage}`)
                        alert(failure.errorMessage)
                    } else {
                        console.error(JSON.stringify(failures))
                    }
                }
            })
            .catch((error) => {
                console.error('Failed to actualize address', error)
                alert(extractErrorMessage(error, 'Failed to actualize address'))
            })
    }, [location, actualizeAddress])

    return location.pathname.indexOf(`${TARGET_URL_PART}/`) !== -1 && (
        <Button size='small' onClick={onClick} title='Actualize address'>
            <Download size='small' />
        </Button>
    )
}

const ResolveAddressDuplicate = () => {
    const location = useLocation()
    const path = location.pathname.split('/').splice(2, 2)
    const addressId = (path[0] === TARGET_URL_PART && path[1]) ? path[1] : null

    const { data } = useQuery(GET_ADDRESS_QUERY, {
        variables: { id: addressId },
        skip: !addressId,
    })

    const [resolveDuplicate] = useMutation(RESOLVE_ADDRESS_DUPLICATE_MUTATION)

    const possibleDuplicate = data?.address?.possibleDuplicateOf

    const onClick = useCallback(() => {
        if (!possibleDuplicate) return

        // eslint-disable-next-line no-restricted-globals
        const choice = prompt(
            `This address is a possible duplicate of:\n${possibleDuplicate.address} (${possibleDuplicate.id})\n\n` +
            'Type "merge" to MERGE (this address will be removed, all sources moved to the existing one)\n' +
            'Type "dismiss" to DISMISS (mark as not a duplicate, possibleDuplicateOf will be cleared)\n\n' +
            'Leave empty or press Cancel to abort.'
        )

        if (!choice) return

        const action = choice.trim().toLowerCase()
        if (action !== 'merge' && action !== 'dismiss') {
            alert(`Unknown action: "${choice}". Please type "merge" or "dismiss".`)
            return
        }

        const sender = getClientSideSenderInfo()
        const mutationData = {
            dv: 1,
            sender,
            addressId,
            action,
            ...(action === 'merge' ? { winnerId: possibleDuplicate.id } : {}),
        }

        resolveDuplicate({ variables: { data: mutationData } })
            .then(({ data: result }) => {
                console.log(`Duplicate ${result.result.status}`)
                if (action === 'merge') {
                    window.location.href = location.pathname.replace(addressId, possibleDuplicate.id)
                } else {
                    window.location.reload()
                }
            })
            .catch((error) => {
                console.error('Failed to resolve duplicate', error)
                alert(extractErrorMessage(error, 'Failed to resolve duplicate'))
            })
    }, [addressId, location.pathname, possibleDuplicate, resolveDuplicate])

    if (!possibleDuplicate) return null

    return (
        <Button size='small' onClick={onClick} title='Resolve duplicate'>
            <Link size='small' />
        </Button>
    )
}

export default {
    logo: Logo,
    pages: () => {
        window.React = React
        return []
    },
    itemHeaderActions: () => {
        return (
            <Space direction='vertical' align='end'>
                <Space>
                    <ItemId />
                    <AddNewItem />
                </Space>
                <Space>
                    <UpdateAddress />
                    <ResolveAddressDuplicate />
                </Space>
            </Space>
        )
    },
}

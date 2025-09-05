import { useMutation, gql } from '@apollo/client'
import Logo from '@app/address-service/admin-ui/logo'
import { ItemId, AddNewItem } from '@open-keystone/app-admin-ui/components'
import React, { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { Download } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

const TARGET_URL_PART = 'addresses'

const ICON_STYLE = {
    cursor: 'pointer',
    marginLeft: '20px',
}

const ACTUALIZE_ADDRESSES_MUTATION = gql`
    mutation actualizeAddresses ($data: ActualizeAddressesInput!) {
        result: actualizeAddresses(data: $data) { successIds failures { addressId errorMessage } }
    }
`

const UpdateAddress = (props) => {
    const location = useLocation()
    const [actualizeAddress] = useMutation(ACTUALIZE_ADDRESSES_MUTATION)
    const onClick = useCallback(() => {
        const sender = getClientSideSenderInfo()
        const path = location.pathname.split('/').splice(2, 2)
        const addressId = (path[0] === TARGET_URL_PART && path[1]) ? path[1] : null
        const data = { dv: 1, sender, addresses: [{ id: addressId }] }
        actualizeAddress({ variables: { data } })
            .then(({ data }) => {
                const { result: { successIds, failures } } = data
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
            })
    }, [location, actualizeAddress])

    return location.pathname.indexOf(`${TARGET_URL_PART}/`) !== -1 && (
        <span style={ICON_STYLE} onClick={onClick}>
            <Download/>
        </span>
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
            <div>
                <ItemId/>
                <AddNewItem/>
                <UpdateAddress/>
            </div>
        )
    },
}

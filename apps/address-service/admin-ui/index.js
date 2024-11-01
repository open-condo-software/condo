import LinkAddressAndSource from '@app/address-service/admin-ui/LinkAddressAndSource'
import Logo from '@app/address-service/admin-ui/logo'
import React from 'react'


export default {
    logo: Logo,
    pages: () => {
        window.React = React
        return [
            {
                label: 'Link address and source',
                path: 'link-address-and-source',
                component: LinkAddressAndSource,
            },
            {
                label: 'Address service models',
                children: [
                    { listKey: 'Address', label: 'Address' },
                    { listKey: 'AddressSource', label: 'Address source' },
                    { listKey: 'AddressInjection', label: 'Address injection' },
                    { listKey: 'User', label: 'User' },
                ],
            },
        ]
    },
}

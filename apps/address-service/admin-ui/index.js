import Logo from '@app/address-service/admin-ui/logo'
import React from 'react'

export default {
    logo: Logo,
    pages: () => {
        window.React = React
        return []
    },
}

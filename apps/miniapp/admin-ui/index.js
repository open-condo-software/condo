import React from 'react'

import { Logo } from './Logo'


export default {
    logo: Logo,
    pages: () => {
        window.React = React
        return []
    },
}

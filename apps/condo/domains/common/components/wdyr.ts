// <reference types="@welldone-software/why-did-you-render" />
import React from 'react'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render')

    whyDidYouRender(React, { trackAllPureComponents: true })
}
import React from 'react'

import BaseLayout, { PageContent, PageWrapper } from './BaseLayout'

function TopMenuOnlyLayout ({ children, ...props }) {
    return <BaseLayout
        {...props}
        logoLocation="topMenu"
        className="top-menu-only-layout"
    >
        <PageWrapper>
            <PageContent>{children}</PageContent>
        </PageWrapper>
    </BaseLayout>
}

export default TopMenuOnlyLayout

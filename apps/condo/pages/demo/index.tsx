import { Tabs } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import Input from '@condo/domains/common/components/antd/Input'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useSearch } from '@condo/domains/common/hooks/useSearch'

const Component: React.FC = () => {
    const [search, handleSearchChange] = useSearch()
    return (
        <Input
            placeholder='Some placeholder'
            onChange={(e) => {handleSearchChange(e.target.value)}}
            value={search}
            allowClear
        />
    )
}

const DemoPage: React.FC = () => {
    const router = useRouter()
    const [tab, setTab] = useState('acc')
    
    const handleChange = useCallback((activeKey: string) => {
        router.replace({ query: { tab: activeKey } }).then(() => setTab(activeKey))
    }, [router])

    return (
        <PageWrapper>
            <TablePageContent>
                <Tabs
                    destroyInactiveTabPane
                    tabBarStyle={{ marginBottom: 40 }}
                    defaultActiveKey='acc'
                    onChange={handleChange}
                    activeKey={tab}
                >
                    <Tabs.TabPane key='acc' tab='Acc Title'>
                        <Component/>
                    </Tabs.TabPane>
                    <Tabs.TabPane key='pay' tab='Acc Title'>
                        <Component/>
                    </Tabs.TabPane>
                </Tabs>
            </TablePageContent>
        </PageWrapper>
    )
}

export default DemoPage
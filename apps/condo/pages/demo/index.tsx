import { Tabs, Select } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import Input from '@condo/domains/common/components/antd/Input'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'

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
    const [newsItemId, setNewsItemId] = useState()

    const handleChange = useCallback((activeKey: string) => {
        router.replace({ query: { tab: activeKey } }).then(() => setTab(activeKey))
    }, [router])

    const { objs: newsItems, loading: loadingNewsItems } = NewsItem.useObjects({})
    const { objs: newsItemScopes, loading: loadingNewsItemScopes } = NewsItemScope.useObjects({ where: { newsItem: { id: newsItemId } } })

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
            {!loadingNewsItems && (
                <Select onSelect={setNewsItemId}>
                    {newsItems.map(newsItem => (
                        <Select.Option
                            key={newsItem.id}
                            value={newsItem.id}
                        >
                            {newsItem.title}
                        </Select.Option>
                    ))}
                </Select>
            )}
            {!loadingNewsItemScopes && (
                <RecipientCounter newsItemScopes={newsItemScopes}/>
            )}
        </PageWrapper>
    )
}

export default DemoPage

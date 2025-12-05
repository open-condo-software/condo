import { List, Typography, Space } from 'antd'
import React from 'react'

import { Check, Close } from '@open-condo/icons'

const { Text } = Typography

interface Feature {
    key: string
    name: string
    available: boolean
}

interface FeatureListProps {
    /**
     * List of features with availability
     */
    features: Feature[]
}

/**
 * Component to display list of features with availability status
 */
export const FeatureList: React.FC<FeatureListProps> = ({ features }) => {
    return (
        <List
            dataSource={features}
            renderItem={(feature) => (
                <List.Item>
                    <Space size='small'>
                        {feature.available ? (
                            <Check color='#52c41a' />
                        ) : (
                            <Close color='#ff4d4f' />
                        )}
                        <Text type={feature.available ? undefined : 'secondary'}>
                            {feature.name}
                        </Text>
                    </Space>
                </List.Item>
            )}
        />
    )
}

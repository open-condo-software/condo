import { Row, Col } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'


export const DocumentsPreview = ({ files }) => {
    return (
        <Row gutter={[0, 8]} style={{ width: '100%' }}>
            {
                files?.map((file, ind) => (
                    <Col key={file?.id || file?.uid || ind} span={24}  style={{ width: '100%' }}>
                        <div style={{ borderRadius: 12, border: '1px solid #E6E8F1', padding: 12, width: '100%' }}>
                            <Typography.Text>{file?.response?.originalName}</Typography.Text>
                        </div>
                    </Col>
                ))
            }
        </Row>
    )
}
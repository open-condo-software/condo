import { resourceIdIconMap } from '../../utils/clientSchema'
import React from 'react'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Col, Row, Space, Typography } from 'antd'
import styled from '@emotion/styled'
import { colors, fontSizes, shadows, transitions } from '@condo/domains/common/constants/style'
import { IMeterResourceUIState } from '../../utils/clientSchema/MeterResource'


const ResourceCardContainer = styled(FocusContainer)`
  transition: ${transitions.allDefault};
  
    &:hover {
      box-shadow: ${shadows.elevated};
      
      span {
        transition: ${transitions.allDefault};
        color: ${colors.sberPrimary[5]};
      }
    }
`

type ResourceCardProps = {
    label: string
    resourceId: string
    onClick: () => void
}

const ResourceCard = ({ label, resourceId, onClick }: ResourceCardProps) => {
    const Icon = resourceIdIconMap[resourceId]

    return (
        <ResourceCardContainer onClick={onClick}>
            <Space>
                <Icon style={{ fontSize: '25px' }} />
                <Typography.Text strong={true} style={{ fontSize: fontSizes.content }}>
                    {label}
                </Typography.Text>
            </Space>
        </ResourceCardContainer>
    )
}

type ResourcesListProps = {
    resources: IMeterResourceUIState[]
    setSelectedMeterResource: React.Dispatch<React.SetStateAction<string>>
}

export const ResourcesList = ({ resources, setSelectedMeterResource }: ResourcesListProps) => {
    return (
        <Row gutter={[0, 10]} justify={'center'}>
            {
                resources.map(resource => (
                    <Col key={resource.id} span={22}>
                        <ResourceCard
                            label={resource.name}
                            resourceId={resource.id}
                            onClick={() => setSelectedMeterResource(resource.id)}
                        />
                    </Col>
                ))
            }
        </Row>
    )
}
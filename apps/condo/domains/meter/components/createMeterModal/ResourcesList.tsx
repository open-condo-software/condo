import { MeterResource, resourceIdToIcon } from '../../utils/clientSchema'
import React from 'react'
import { Loader } from '@condo/domains/common/components/Loader'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Col, Row, Space, Typography } from 'antd'
import styled from '@emotion/styled'
import { shadows, transitions } from '@condo/domains/common/constants/style'


const ResourceCardContainer = styled(FocusContainer)`
  transition: ${transitions.allDefault};
  
    &:hover {
      // TODO(nomerdvadcatpyat): change .hover to .elevated when pr #555 will be merged into master
      box-shadow: ${shadows.hover};
      
      span {
        transition: ${transitions.allDefault};
        color: #73de90;
      }
    }
`


type ResourceCardProps = {
    label: string
    resourceId: string
    onClick: () => void
}

const ResourceCard = ({ label, resourceId, onClick }: ResourceCardProps) => {
    const Icon = resourceIdToIcon[resourceId]

    return (
        <ResourceCardContainer onClick={onClick}>
            <Space>
                <Icon />
                <Typography.Text strong={true} style={{ fontSize: '16px' }}>{label}</Typography.Text>
            </Space>
        </ResourceCardContainer>
    )
}

type ResourcesListProps = {
    setSelectedMeterResource: React.Dispatch<React.SetStateAction<string>>
}

export const ResourcesList = ({ setSelectedMeterResource }: ResourcesListProps) => {
    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    return resourcesLoading ? <Loader /> :
        (
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
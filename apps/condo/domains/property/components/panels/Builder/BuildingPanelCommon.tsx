/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import React, { useRef, useEffect } from 'react'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MapEdit, MapView } from './MapConstructor'
import { FullscreenFooter } from './Fullscreen'

export const PropertyMapFloor: React.FC = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

export const EmptyFloor: React.FC = () => {
    return (
        <div style={{ display: 'block' }}>
            <UnitButton secondary disabled >&nbsp;</UnitButton>
        </div>
    )
}

export const EmptyBuildingBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyPropertyBuildingHeader = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingHeader' })
    const EmptyPropertyBuildingDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingDescription' })
    const descriptionStyle = {
        display: 'flex',
        fontSize: '16px',
        maxWidth: '350px',
    }
    return (
        <BasicEmptyListView image='/propertyEmpty.svg' >
            <Typography.Title level={3} >
                {EmptyPropertyBuildingHeader}
            </Typography.Title>
            <Typography.Text style={descriptionStyle}>
                {EmptyPropertyBuildingDescription}
            </Typography.Text>
        </BasicEmptyListView>
    )
}


interface IBuildingAxisYProps {
    floors: number[]
}

export const BuildingAxisY: React.FC<IBuildingAxisYProps> = ({ floors }) => {
    return (
        <div style={{ display: 'inline-block', marginRight: '12px' }}>
            {
                floors.map(floorNum => (
                    <UnitButton secondary disabled key={`floor_${floorNum}`} style={{ display: 'block' }}>{floorNum}</UnitButton>
                ))
            }
            <UnitButton secondary disabled >&nbsp;</UnitButton>
        </div>
    )
}

interface IBuildingChooseSectionsProps {
    Builder: MapEdit | MapView
    refresh(): void
    toggleFullscreen?(): void
    isFullscreen?: boolean
}

export const BuildingChooseSections: React.FC<IBuildingChooseSectionsProps> = ({
    Builder,
    refresh,
    toggleFullscreen,
    isFullscreen,
}) => {
    const intl = useIntl()
    const RequestFullscreenMessage = intl.formatMessage({ id: 'FullscreenRequest' })
    const ExitFullscreenMessage = intl.formatMessage({ id: 'FullscreenExit' })

    const updateVisibleSections = (value) => {
        Builder.setVisibleSections(value)
        refresh()
    }
    const sections = Builder.sections

    return (
        <Checkbox.Group onChange={updateVisibleSections} value={Builder.visibleSections}
            style={{ width: '100%', marginTop: '36px' }} >

            <Row
                css={FullscreenFooter}
                gutter={[40, 40]}
            >
                {
                    sections.length >= 2 && sections.map(section => (
                        <Col key={section.id} flex={0} style={{ paddingTop: '10px' }}>
                            <Checkbox value={section.id}>{section.name}</Checkbox>
                        </Col>
                    ))
                }
                <Col style={{ marginLeft: 'auto' }}>
                    <span>
                        <Button
                            style={{ position: 'relative' }}
                            color={'green'}
                            type={'sberPrimary'}
                            secondary
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            size={'large'}
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen
                                ? ExitFullscreenMessage
                                : RequestFullscreenMessage}
                        </Button>
                    </span>
                </Col>
            </Row>
        </Checkbox.Group>
    )
}

export function useHorizontalScroll (): React.RefObject<HTMLElement>{
    const elementRef = useRef<HTMLElement | null>(null)
    useEffect(() => {
        const element = elementRef.current
        if (element) {
            const onWheel = (event: WheelEvent) => {
                if (event.deltaY == 0) return
                event.preventDefault()
                element.scrollTo({
                    left: element.scrollLeft + event.deltaY,
                })
            }
            element.addEventListener('wheel', onWheel)
            return () => element.removeEventListener('wheel', onWheel)
        }
    }, [])
    return elementRef
}

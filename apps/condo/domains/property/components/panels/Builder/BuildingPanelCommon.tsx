
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MapEdit, MapView } from './MapConstructor'

export const FullscreenHeader = styled.div<{
    edit?: boolean
}>`
    margin: -24px -24px 0;
    padding: 12px 24px;
    ${({ edit }) => (!edit ? `
        display: none;
        width: 100%;
    ` : '')}


    div:fullscreen & {
        border-bottom: 1px solid #D9D9D9;
        background: rgba(255,255,255, 0.9);
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 2;
        margin: 0;
        display: block;
    }

    ${({ edit }) => (edit ? `
        &>div:first-child {
            display: none;
        }

        div:fullscreen>&>div:first-child {
            display: flex;
        }
    ` : '')}
`

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
    maximizableElement?: React.RefObject<HTMLElement | null>
}


const fullcreen = {
    left: '0',
    right: '0',
    bottom: '0',
    padding: '12px 61px 12px 45px',
    background: 'rgba(255, 255, 255, 0.9)',
    ZIndex: '1',
    Position: 'fixed',
    borderTop: '1px solid #D9D9D9',
    marginRight: '-21px',
}

const normalscreen = {
    margin: '0 -21px 0 -24px',
    padding: '12px 0px 12px 4px',
}


export const BuildingChooseSections: React.FC<IBuildingChooseSectionsProps> = ({
    Builder,
    refresh,
    maximizableElement,
}) => {
    const intl = useIntl()
    const RequestFullscreenMessage = intl.formatMessage({ id: 'FullscreenRequest' })
    const ExitFullscreenMessage = intl.formatMessage({ id: 'FullscreenExit' })

    let isFullscreen
    let setIsFullscreen

    try {
        [isFullscreen, setIsFullscreen] = useFullscreenStatus(maximizableElement)
    } catch (e) {
        isFullscreen = false
        setIsFullscreen = undefined
    }

    const handleExitFullscreen = () => document.exitFullscreen() //?
    const handleFullscreen = () => {
        isFullscreen ? handleExitFullscreen() : setIsFullscreen()
    }

    const updateVisibleSections = (value) => {
        Builder.setVisibleSections(value)
        refresh()
    }
    const sections = Builder.sections

    return (
        <Checkbox.Group onChange={updateVisibleSections} value={Builder.visibleSections}
            style={{ width: '100%', marginTop: '36px' }} >

            <Row
                style={isFullscreen ? fullcreen : normalscreen}
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
                            onClick={handleFullscreen}
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


const getBrowserFullscreen = (): string | null => {
    let result

    if (typeof document.fullscreenElement !== 'undefined') {
        result = 'fullscreenElement'
    } else if (typeof document['mozFullScreenElement'] !== 'undefined') {
        result = 'mozFullScreenElement'
    } else if (typeof document['webkitFullscreenElement'] !== 'undefined') {
        result = 'webkitFullscreenElement'
    } else {
        throw new Error('This browser not supports fullscreenElement')
    }
    return result
}

const requestFullscreen = async (elem): Promise<void> => {
    if (elem.requestFullscreen) {
        await elem.requestFullscreen()
    } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen()
    } else if (elem.webkitRequestFullScreen) {
        await elem.webkitRequestFullScreen()
    }
}

export const useFullscreenStatus = (elRef: React.RefObject<HTMLElement | null>): [boolean, () => Promise<void>] => {
    const browserFullscreen = getBrowserFullscreen()

    const [isFullscreen, setIsFullscreen] = useState(
        document[browserFullscreen] != null
    )

    const setFullscreen = async () => {
        if (elRef.current == null) return

        try {
            await requestFullscreen(elRef.current)
            setIsFullscreen(document[browserFullscreen] != null)
        } catch (e) {
            setIsFullscreen(false)
        }
    }

    useLayoutEffect(() => {
        document.onfullscreenchange = () =>
            setIsFullscreen(document[browserFullscreen] != null)

        return () => (document.onfullscreenchange = undefined)
    })

    return [isFullscreen, setFullscreen]
}

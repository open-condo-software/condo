import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { BuildingUnitSubType, B2BAppGlobalFeature } from '@app/condo/schema'
import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Row, Typography, RowProps } from 'antd'
import debounce from 'lodash/debounce'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, RadioGroupProps, Radio } from '@open-condo/ui'

import { CardVideo } from '@condo/domains/common/components/CardVideo'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { fontSizes, colors, UNIT_TYPE_COLOR_SET } from '@condo/domains/common/constants/style'
import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'

import { FullscreenFooter } from './Fullscreen'
import { MapEdit, MapView, MapViewMode } from './MapConstructor'
import { UnitButton } from './UnitButton'


const MESSAGE_DEBOUNCE_TIMEOUT = 2000

export const CustomScrollbarCss = css`
  & div::-webkit-scrollbar {
    width: 14px;
    border-right: 5px solid transparent;
  }
  & div::-webkit-scrollbar-thumb {
    background-color: ${colors.inputBorderGrey};
    border-radius: 10px;
    border: 4px solid transparent;
    background-clip: padding-box;
    width: 5px;
  }
  & div::-webkit-scrollbar-thumb:hover {
    background-color: ${colors.inputBorderHover};
    border: 2px solid transparent;
  }
  & div::-webkit-scrollbar-track {
    border-radius: 10px;
  }
  & div::-webkit-scrollbar-track,
  & div::-webkit-scrollbar-corner {
    background-color: ${colors.backgroundLightGrey};
  }
`

export const MapSectionContainer = styled.div<{ visible: boolean }>`
  display: ${({ visible }) => visible ? 'inline-block' : 'none'};
  margin-right: 28px;
  text-align: center;
`

export const PropertyMapFloor: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

export const EmptyFloor: React.FC = () => {
    return (
        <div style={{ display: 'block' }}>
            <UnitButton type='floor' disabled>&nbsp;</UnitButton>
        </div>
    )
}

interface IEmptyBuildingBlock extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    mode?: 'view' | 'edit'
}

const DESCRIPTION_STYLE: React.CSSProperties = {
    display: 'block',
    fontSize: fontSizes.content,
    maxWidth: '350px',
    color: colors.inputBorderHover,
    margin: 'auto',
    marginTop: '8px',
    whiteSpace: 'pre-line',
}

const CARD_VIDEO_CONTAINER_STYLE = { display: 'flex', alignItems: 'center', justifyContent: 'center' }
const CARD_VIDEO_WRAPPER_STYLE = { maxHeight: '390px', maxWidth: '500px' }

const {
    publicRuntimeConfig,
} = getConfig()

const { createMapVideoUrl } = publicRuntimeConfig

export const EmptyBuildingBlock: React.FC<IEmptyBuildingBlock> = ({ mode = 'view', canManageProperties = false }) => {
    const intl = useIntl()
    const EmptyPropertyBuildingHeader = intl.formatMessage({ id: `pages.condo.property.EmptyBuildingBlock.${mode}.EmptyBuildingHeader` })
    const MapManualCreateTitle = intl.formatMessage({ id: 'Create' })
    const MapAutoCreateTitle = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingBlock.view.CreateMapAutomaticallyTitle' })
    const MapEditEmptyBuildingDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingBlock.edit.EmptyBuildingDescription' })
    const CardVideoTitle = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingBlock.edit.CardVideoTitle' })
    const CardVideoDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingBlock.edit.CardVideoDescription' })

    const { push, asPath, query: { id: propertyId } } = useRouter()
    const createMapCallback = useCallback(() => {
        push(asPath + '/map/update')
    }, [asPath, push])

    const { features: { PropertyMapGeneration: generatorAppOrigin }, requestFeature } = useGlobalAppsFeaturesContext()

    const EmptyPropertyBuildingDescription = useMemo(() => {
        const services = generatorAppOrigin
            ? intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingBlock.view.auto.EmptyBuildingDescription.services' })
            : ''
        const prefix = `${mode}.${generatorAppOrigin ? 'auto' : 'manual'}`
        const MapViewEmptyBuildingDescription = intl.formatMessage({ id: `pages.condo.property.EmptyBuildingBlock.${prefix}.EmptyBuildingDescription` as FormatjsIntl.Message['ids'] }, { services })

        return mode === 'edit' ? MapEditEmptyBuildingDescription : MapViewEmptyBuildingDescription
    }, [
        intl,
        mode,
        generatorAppOrigin,
        MapEditEmptyBuildingDescription,
    ])

    const debouncedGenerateRequest = useMemo(() => {
        return debounce(() => {
            if (!Array.isArray(propertyId)) {
                requestFeature({ feature: B2BAppGlobalFeature.PropertyMapGeneration, propertyId })
            }
        }, MESSAGE_DEBOUNCE_TIMEOUT, { leading: true, trailing: false })
    }, [
        propertyId,
        requestFeature,
    ])

    const sendGenerateMapRequest = useCallback(() => {
        debouncedGenerateRequest()
    }, [debouncedGenerateRequest])

    const locale = useMemo(() => intl?.locale, [intl])
    const videoUrl = createMapVideoUrl?.[locale]

    if (mode === 'edit' && videoUrl) {
        return (
            <div style={CARD_VIDEO_CONTAINER_STYLE}>
                <div style={CARD_VIDEO_WRAPPER_STYLE}>
                    <CardVideo
                        src={videoUrl}
                        title={CardVideoTitle}
                        description={CardVideoDescription}
                    />
                </div>
            </div>
        )
    }

    return (
        <BasicEmptyListView image='/propertyEmpty.svg'>
            <Row gutter={[0, 20]}>
                <Col xs={24}>
                    <Typography.Title level={3}>
                        {EmptyPropertyBuildingHeader}
                    </Typography.Title>
                    <Typography.Text style={DESCRIPTION_STYLE}>
                        {EmptyPropertyBuildingDescription}
                    </Typography.Text>
                </Col>
                <Col xs={24} span={20}>
                    {canManageProperties && (
                        <>
                            {mode === 'view' && generatorAppOrigin && (
                                <Button
                                    type='secondary'
                                    onClick={sendGenerateMapRequest}
                                >{MapAutoCreateTitle}</Button>
                            )}
                            {mode === 'view' && (
                                <Button
                                    type='secondary'
                                    onClick={createMapCallback}
                                >{MapManualCreateTitle}</Button>

                            )}
                        </>
                    )}
                </Col>
            </Row>
        </BasicEmptyListView>
    )
}

interface IBuildingAxisYProps {
    floors: number[]
}

const BuildingAxisContainer = styled.div`
  display: inline-block;
  margin-right: 12px;
  position: sticky;
  left: 0;
  background-color: ${colors.backgroundLightGrey};
  z-index: 2;
`

export const BuildingAxisY: React.FC<IBuildingAxisYProps> = ({ floors }) => {
    return (
        <BuildingAxisContainer>
            {
                floors.map(floorNum => (
                    <UnitButton type='floor' disabled key={`floor_${floorNum}`}>
                        {String(floorNum)}
                    </UnitButton>
                ))
            }
            <UnitButton type='floor' disabled>&nbsp;</UnitButton>
        </BuildingAxisContainer>
    )
}

interface IBuildingChooseSectionsProps {
    builder: MapEdit | MapView
    refresh(): void
    toggleFullscreen?(): void
    isFullscreen?: boolean
    mode?: 'view' | 'edit'
}

const FULLSCREEN_FOOTER_GUTTER: RowProps['gutter'] = [40, 40]

export const BuildingChooseSections: React.FC<React.PropsWithChildren<IBuildingChooseSectionsProps>> = (props) => {
    const intl = useIntl()
    const RequestFullscreenMessage = intl.formatMessage({ id: 'FullscreenRequest' })
    const ExitFullscreenMessage = intl.formatMessage({ id: 'FullscreenExit' })

    const {
        toggleFullscreen,
        isFullscreen,
        mode = 'view',
        children,
    } = props

    return (

        <Row
            css={FullscreenFooter}
            gutter={FULLSCREEN_FOOTER_GUTTER}
        >
            <Col>
                {mode === 'view' ? (
                    <Button
                        type='secondary'
                        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullscreen}
                    >
                        {isFullscreen
                            ? ExitFullscreenMessage
                            : RequestFullscreenMessage}
                    </Button>
                ) : children}
            </Col>
        </Row>

    )
}

export const BuildingViewModeSelect: React.FC<RadioGroupProps> = (props) => {
    const { value, onChange, disabled } = props
    const intl = useIntl()
    const ParkingBuildingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const ResidentialBuildingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.residentialBuilding' })

    return (
        <Radio.Group 
            optionType='button' 
            value={value} 
            onChange={onChange} 
            defaultValue={MapViewMode.section}
            disabled={disabled}
        >
            <Radio
                key={MapViewMode.section}
                value={MapViewMode.section}
                label={ResidentialBuildingLabel}
            />
            <Radio
                key={MapViewMode.parking}
                value={MapViewMode.parking}
                label={ParkingBuildingLabel}
            />
        </Radio.Group>
    )
}

export const UnitTypeLegendItem = styled.div<{ unitType: BuildingUnitSubType }>`
  display: flex;
  height: 38px;
  align-items: center;
  
  &:before {
    content: "";
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    margin-right: 5px;
    background-color: ${({ unitType }) => UNIT_TYPE_COLOR_SET[unitType]};
  }
`

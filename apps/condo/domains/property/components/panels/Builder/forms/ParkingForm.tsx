/** @jsx jsx */
import { DownOutlined, DeleteFilled } from '@ant-design/icons'
import { jsx } from '@emotion/react'
import { Row, Col, Space, Typography, InputNumber } from 'antd'
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Checkbox } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'

import {
    IPropertyMapModalForm,
    MODAL_FORM_ROW_GUTTER,
    INPUT_STYLE,
    FormModalCss,
    MODAL_FORM_BUTTON_STYLE,
    TEXT_BUTTON_STYLE,
    MODAL_FORM_EDIT_GUTTER,
    MODAL_FORM_BUTTON_GUTTER,
    FULL_SIZE_UNIT_STYLE,
} from './BaseUnitForm'

const AddParkingForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const ParkingNameLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.floorCount' })
    const ParkingOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.parkingOnFloor' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const CreateNewLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.create' })
    const CopyLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.mode.copy' })

    const [minFloor, setMinFloor] = useState<number>(1)
    const [floorCount, setFloorCount] = useState<number | null>(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [copyId, setCopyId] = useState<string | null>(null)
    const [parkingName, setParkingName] = useState<string>(builder.nextParkingName)

    const toggleMinFloorVisible = useCallback(() => {
        setMinFloor(1)
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])
    const setMinFloorValue = useCallback((value) => { setMinFloor(value) }, [])
    const setFloorCountValue = useCallback((value) => { setFloorCount(value) }, [])
    const setParkingNameValue = useCallback((value) => setParkingName(value ? value.toString() : ''), [])
    const maxFloorValue = useMemo(() => {
        if (floorCount === 1) return minFloor
        if (minFloor > 0) return floorCount + minFloor - 1
        return floorCount + minFloor
    }, [floorCount, minFloor])

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
    }, [])

    useEffect(() => {
        if (minFloor && floorCount && unitsOnFloor && parkingName) {
            builder.addPreviewParking({
                id: '',
                name: parkingName,
                minFloor,
                maxFloor: maxFloorValue,
                unitsOnFloor,
            })
            refresh()
        } else {
            builder.removePreviewParking()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minFloor, floorCount, unitsOnFloor, parkingName])

    useEffect(() => {
        if (copyId !== null) {
            builder.addPreviewCopyParking(copyId)
        }
    }, [builder, copyId])

    const handleFinish = useCallback(() => {
        builder.removePreviewParking()
        if (copyId === null) {
            builder.addParking({ id: '', name: parkingName, minFloor, maxFloor: maxFloorValue, unitsOnFloor })
            setParkingName(builder.nextParkingName)
        } else {
            builder.addCopyParking(copyId)
        }

        refresh()
        resetForm()
    }, [refresh, resetForm, builder, minFloor, unitsOnFloor, maxFloorValue, parkingName, copyId])

    const isSubmitDisabled = copyId !== null ? false : !(minFloor && floorCount && unitsOnFloor)
    const isCreateColumnsHidden = copyId !== null
    const iconRotation = minFloorHidden ? 0 : 180
    const minFloorMargin = minFloorHidden ? '-28px' : 0

    const parkingOptions = useMemo(() => (
        builder.map.parking.filter(section => !section.preview).map(section => (
            <Select.Option
                key={`copy-${section.id}`}
                value={section.id}
            >
                {CopyLabel} {section.name}
            </Select.Option>
        ))
    ), [builder.map.parking, CopyLabel])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Select value={copyId} onSelect={setCopyId} disabled={builder.isEmptyParking}>
                    <Select.Option key='create' value={null}>{CreateNewLabel}</Select.Option>
                    {parkingOptions}
                </Select>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{ParkingNameLabel}</Typography.Text>
                    <InputNumber
                        value={parkingName}
                        min={1}
                        onChange={setParkingNameValue}
                        style={INPUT_STYLE}
                        type='number'
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{FloorCountLabel}</Typography.Text>
                    <InputNumber
                        value={floorCount}
                        onChange={setFloorCountValue}
                        style={INPUT_STYLE}
                        type='number'
                        min={1}
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden} style={{ marginTop: minFloorMargin }}>
                <Space
                    direction='vertical'
                    size={8}
                    hidden={minFloorHidden}
                >
                    <Typography.Text type='secondary'>{MinFloorLabel}</Typography.Text>
                    <InputNumber
                        value={minFloor}
                        onChange={setMinFloorValue}
                        style={INPUT_STYLE}
                        type='number'
                    />
                </Space>
                <Typography.Text onClick={toggleMinFloorVisible} style={TEXT_BUTTON_STYLE}>
                    {minFloorHidden ? ShowMinFloor : HideMinFloor} <DownOutlined rotate={iconRotation} />
                </Typography.Text>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{ParkingOnFloorLabel}</Typography.Text>
                    <InputNumber min={1} value={unitsOnFloor} onChange={setUnitsOnFloor} style={INPUT_STYLE} type='number'/>
                </Space>
            </Col>
            <Col span={24}>
                <Button
                    key='submit'
                    onClick={handleFinish}
                    type='sberDefaultGradient'
                    style={MODAL_FORM_BUTTON_STYLE}
                    disabled={isSubmitDisabled}
                > {AddLabel} </Button>
            </Col>
        </Row>
    )
}

const EditParkingForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const RenameNextParkingUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParking' })

    const [parkingName, setParkingName] = useState<string>('')
    const renameNextUnits = useRef(true)

    const parkingSection = builder.getSelectedParking()

    const deleteParking = useCallback(() => {
        builder.removeParking(parkingSection.id, renameNextUnits.current)
        refresh()
    }, [builder, refresh, parkingSection])

    const updateParkingSection = useCallback(() => {
        builder.updateParking({ ...parkingSection, name: parkingName }, renameNextUnits.current)
        refresh()
    }, [builder, refresh, parkingName, parkingSection])

    const setParkingNameValue = useCallback((value) => setParkingName(value ? value.toString() : ''), [])
    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])

    useEffect(() => {
        setParkingName(parkingSection ? parkingSection.name : '')
    }, [parkingSection])

    return (
        <Row gutter={MODAL_FORM_EDIT_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{NameLabel}</Typography.Text>
                    <InputNumber
                        value={parkingName}
                        min={1}
                        onChange={setParkingNameValue}
                        style={INPUT_STYLE}
                    />
                </Space>
                <Col span={24}>
                    <Checkbox onChange={toggleRenameNextUnits}>
                        {RenameNextParkingUnitsLabel}
                    </Checkbox>
                </Col>
            </Col>
            <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                <Col span={24}>
                    <Button
                        onClick={updateParkingSection}
                        type='sberDefaultGradient'
                    >
                        {SaveLabel}
                    </Button>
                </Col>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={deleteParking}
                        type='sberDangerGhost'
                        icon={<DeleteFilled />}
                        style={FULL_SIZE_UNIT_STYLE}
                    >
                        {DeleteLabel}
                    </Button>
                </Col>
            </Row>
        </Row>
    )
}

export { AddParkingForm, EditParkingForm }

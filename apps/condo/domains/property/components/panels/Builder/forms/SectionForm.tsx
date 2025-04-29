/** @jsx jsx */
import { DownOutlined, DeleteFilled } from '@ant-design/icons'
import { BuildingUnitSubType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Row, Col, Space, Typography, InputNumber } from 'antd'
import isEmpty from 'lodash/isEmpty'
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Checkbox } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { MAX_PROPERTY_FLOORS_COUNT, MAX_PROPERTY_UNITS_COUNT_PER_FLOOR } from '@condo/domains/property/constants/property'

import {
    IPropertyMapModalForm,
    MODAL_FORM_ROW_GUTTER,
    MODAL_FORM_BUTTON_STYLE,
    MODAL_FORM_EDIT_GUTTER,
    INPUT_STYLE,
    TEXT_BUTTON_STYLE,
    MODAL_FORM_BUTTON_GUTTER,
    FULL_SIZE_UNIT_STYLE,
    FormModalCss,
} from './BaseUnitForm'

const AddSectionForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.numberOfSection' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.floorCount' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const CreateNewLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.create' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const CopyLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.copy' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })

    const [minFloor, setMinFloor] = useState(1)
    const [floorCount, setFloorCount] = useState(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)
    const [copyId, setCopyId] = useState<string | null>(null)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [sectionName, setSectionName] = useState<string>(builder.nextSectionName)
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(BuildingUnitSubType.Flat)

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
    }, [])

    const toggleMinFloorVisible = useCallback(() => {
        if (!minFloorHidden) {
            setMinFloor(1)
        }
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])

    const setMinFloorValue = useCallback((value) => { setMinFloor(value) }, [])
    const setFloorCountValue = useCallback((value) => { setFloorCount(value) }, [])
    const maxFloorValue = useMemo(() => {
        if (floorCount === 1) return minFloor
        if (minFloor > 0) return floorCount + minFloor - 1
        return floorCount + minFloor
    }, [floorCount, minFloor])

    useEffect(() => {
        if (minFloor && floorCount && unitsOnFloor && sectionName) {
            builder.addPreviewSection({
                id: '',
                name: sectionName,
                minFloor,
                maxFloor: maxFloorValue,
                unitsOnFloor,
            }, unitType)
            refresh()
        } else {
            builder.removePreviewSection()
        }
    }, [minFloor, floorCount, unitsOnFloor, sectionName, unitType])

    useEffect(() => {
        if (copyId !== null) {
            builder.addPreviewCopySection(copyId)
        }
    }, [builder, copyId])

    const handleFinish = useCallback(() => {
        builder.removePreviewSection()
        if (copyId === null) {
            builder.addSection({ id: '', name: sectionName, minFloor, maxFloor: maxFloorValue, unitsOnFloor }, unitType)
            setSectionName(builder.nextSectionName)
        } else {
            builder.addCopySection(copyId)
        }

        refresh()
        resetForm()
    }, [refresh, resetForm, builder, sectionName, minFloor, unitsOnFloor, unitType, copyId, maxFloorValue])

    const setSectionNameValue = useCallback((value) => setSectionName(value ? value.toString() : ''), [])
    const isSubmitDisabled = copyId !== null ? false : !(minFloor && floorCount && unitsOnFloor)
    const isCreateColumnsHidden = copyId !== null
    const iconRotation = minFloorHidden ? 0 : 180
    const minFloorMargin = minFloorHidden ? '-28px' : 0

    const sectionOptions = useMemo(() => (
        builder.map.sections.filter(section => !section.preview).map(section => (
            <Select.Option
                key={`copy-${section.id}`}
                value={section.id}
                data-cy='property-map__add-section-form__section-mode-select__copy-option'
            >
                {CopyLabel}{section.name}
            </Select.Option>
        ))
    ), [builder.map.sections, CopyLabel])

    const unitTypeOptions = useMemo(() => (
        Object.values(BuildingUnitSubType)
            .filter(unitType => unitType !== BuildingUnitSubType.Parking)
            .map((unitType, key) => (
                <Select.Option key={`${key}-${unitType}`} value={unitType} title={unitType}>
                    {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                </Select.Option>
            ))
    ), [BuildingUnitSubType])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss} data-cy='property-map__add-section-form'>
            <Col span={24}>
                <Select
                    value={copyId}
                    onSelect={setCopyId}
                    disabled={builder.isEmptySections}
                    data-cy='property-map__add-section-form__section-mode-select'
                >
                    <Select.Option key='create' value={null}>{CreateNewLabel}</Select.Option>
                    {sectionOptions}
                </Select>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{SectionNameLabel}</Typography.Text>
                    <InputNumber
                        value={sectionName}
                        min={1}
                        onChange={setSectionNameValue}
                        style={INPUT_STYLE}
                        type='number'
                        data-cy='property-map__add-section-form__section-name'
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{FloorCountLabel}</Typography.Text>
                    <InputNumber
                        value={floorCount}
                        onChange={setFloorCountValue}
                        min={1}
                        max={MAX_PROPERTY_FLOORS_COUNT}
                        style={INPUT_STYLE}
                        type='number'
                        data-cy='property-map__add-section-form__floor-count'
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{UnitTypeLabel}</Typography.Text>
                    <Select value={unitType} onSelect={setUnitType} data-cy='property-map__add-section-form__unit-type'>
                        {unitTypeOptions}
                    </Select>
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
                    {minFloorHidden ? ShowMinFloor : HideMinFloor} <DownOutlined rotate={iconRotation}/>
                </Typography.Text>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{UnitsOnFloorLabel}</Typography.Text>
                    <InputNumber
                        min={1}
                        max={MAX_PROPERTY_UNITS_COUNT_PER_FLOOR}
                        value={unitsOnFloor}
                        onChange={setUnitsOnFloor}
                        style={INPUT_STYLE}
                        type='number'
                        data-cy='property-map__add-section-form__units-on-floor'
                    />
                </Space>
            </Col>
            <Col span={24}>
                <Button
                    key='submit'
                    onClick={handleFinish}
                    type='sberDefaultGradient'
                    style={MODAL_FORM_BUTTON_STYLE}
                    disabled={isSubmitDisabled}
                    data-cy='property-map__section-form__submit-button'
                > {AddLabel} </Button>
            </Col>
        </Row>
    )
}


const EditSectionForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const RenameNextUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextSections' })

    const [name, setName] = useState<string>('')
    const renameNextUnits = useRef(true)

    const section = builder.getSelectedSection()

    useEffect(() => {
        setName(section ? section.name : '')
    }, [section])

    const setNameValue = useCallback((value) => setName(value ? value.toString() : ''), [])
    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])

    const updateSection = useCallback(() => {
        builder.updateSection({ ...section, name }, renameNextUnits.current)
        refresh()
    }, [builder, refresh, name, section])

    const deleteSection = useCallback(() => {
        builder.removeSection(section.id, renameNextUnits.current)
        refresh()
    }, [builder, refresh, section])

    return (
        <Row gutter={MODAL_FORM_EDIT_GUTTER} css={FormModalCss} data-cy='property-map__edit-section-form'>
            <Col span={24}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{NameLabel}</Typography.Text>
                    <InputNumber
                        value={name}
                        min={1}
                        placeholder={NamePlaceholderLabel}
                        onChange={setNameValue}
                        style={INPUT_STYLE}
                    />
                    <Col span={24}>
                        <Checkbox onChange={toggleRenameNextUnits}>
                            {RenameNextUnitsLabel}
                        </Checkbox>
                    </Col>
                </Space>
            </Col>
            <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                <Col span={24}>
                    <Button
                        onClick={updateSection}
                        type='sberDefaultGradient'
                        disabled={isEmpty(name)}
                        data-cy='property-map__update-section-button'
                    >{SaveLabel}</Button>
                </Col>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={deleteSection}
                        type='sberDangerGhost'
                        icon={<DeleteFilled />}
                        style={FULL_SIZE_UNIT_STYLE}
                        data-cy='property-map__remove-section-button'
                    >{DeleteLabel}</Button>
                </Col>
            </Row>
        </Row>
    )
}


export { AddSectionForm, EditSectionForm }

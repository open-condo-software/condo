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

const EditParkingForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const RenameNextParkingUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParking' })

    const [parkingName, setParkingName] = useState<string>('')
    const renameNextUnits = useRef(true)

    const parkingSection = builder.getSelectedSection()

    const deleteParking = useCallback(() => {
        builder.removeSection(parkingSection.id, renameNextUnits.current)
        refresh()
    }, [builder, refresh, parkingSection])

    const updateParkingSection = useCallback(() => {
        builder.updateSection({ ...parkingSection, name: parkingName }, renameNextUnits.current)
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

export { EditParkingForm }

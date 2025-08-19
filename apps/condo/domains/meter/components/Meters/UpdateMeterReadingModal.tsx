import { Meter, MeterResource as MeterResourceType, PropertyMeter } from '@app/condo/schema'
import { Col, ColProps, Form, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { Button, Input, Modal } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MeterPageTypes, MeterReadingForOrganization, METER_TAB_TYPES, PropertyMeterReading } from '@condo/domains/meter/utils/clientSchema'

const UPDATE_READINGS_MODAL_ROW_GUTTER: [Gutter, Gutter] = [0, 16]
const FORM_ITEM_WRAPPER_COLUMN_STYLE: ColProps = { style: { width: '100%', padding: 0 } }

type UpdateMeterReadingModalProps = {
    meter: Meter | PropertyMeter
    isShowUpdateReadingModal: boolean
    handleCloseUpdateReadingModal: () => void
    resource: MeterResourceType
    refetch: () => void
    chosenMeterReadingId: string
    meterType: MeterPageTypes
}

const UpdateMeterReadingModal = ({
    meter,
    isShowUpdateReadingModal,
    handleCloseUpdateReadingModal,
    resource,
    refetch,
    chosenMeterReadingId,
    meterType,
}: UpdateMeterReadingModalProps): JSX.Element => {
    const intl = useIntl()
    const UpdateMeterReadingModalTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.UpdateMeterReading.Modal.Title' })
    const UpdateMeterReadingButtonTextMessage = intl.formatMessage({ id: 'pages.condo.meter.UpdateMeterReading.Modal.Text' }, { number: get(meter, 'number') })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const ResourceMeasureMessage = get(resource, 'measure')
    
    const { breakpoints } = useLayoutContext()
    const { requiredValidator, numberValidator } = useValidations()
    const numberOfTariffs = get(meter, 'numberOfTariffs')
    const numberRules = useMemo(() => [numberValidator], [numberValidator])
    const commonRules = useMemo(() => [requiredValidator], [requiredValidator])

    const MeterReadingEntity = meterType === METER_TAB_TYPES.propertyMeter ? PropertyMeterReading : MeterReadingForOrganization

    const updateMeterReadingAction = MeterReadingEntity.useUpdate({}, () => {
        refetch()
        handleCloseUpdateReadingModal()
    })

    const handleUpdateMeterReadingValues = useCallback((values) => {
        updateMeterReadingAction({ ...Object.fromEntries(Object.entries(values).filter(([_, v]) => v != '')) }, { id: chosenMeterReadingId })
    }, [chosenMeterReadingId, updateMeterReadingAction])

    return (
        <FormWithAction
            action={handleUpdateMeterReadingValues}
            children={({ handleSave }) => (
                <Modal 
                    open={isShowUpdateReadingModal}
                    title={UpdateMeterReadingModalTitleMessage}
                    onCancel={handleCloseUpdateReadingModal}
                    footer={[
                        <Button key='cancel' type='secondary' onClick={handleCloseUpdateReadingModal}>
                            {CancelMessage}
                        </Button>,
                        <Button key='submit' type='primary' onClick={handleSave}>
                            {SaveMessage}
                        </Button>,
                    ]}
                >
                    <Row gutter={UPDATE_READINGS_MODAL_ROW_GUTTER}>
                        <Typography.Text type='secondary'>
                            {UpdateMeterReadingButtonTextMessage}
                        </Typography.Text>
                
                        {Array.from(Array(numberOfTariffs).keys()).map((number) => (
                            <Col span={breakpoints.TABLET_LARGE ? 20 : 24} key={number + 1}>
                                <Form.Item
                                    name={`value${number + 1}`}
                                    required
                                    wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                                    rules={numberOfTariffs < 2 ? [...commonRules, ...numberRules] : numberRules}
                                >
                                    <Input
                                        suffix={ResourceMeasureMessage}
                                    />
                                </Form.Item>
                            </Col>
                        ))}

                    </Row>
                </Modal>
            )}
        />
    )
}

export default UpdateMeterReadingModal
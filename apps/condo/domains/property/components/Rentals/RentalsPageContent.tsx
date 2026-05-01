import { useMutation, useQuery } from '@apollo/client'
import { Table as AntTable, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space as AntSpace, Switch, notification } from 'antd'
import dayjs from 'dayjs'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, List, Space, Tabs, Typography } from '@open-condo/ui'

import { RentalUnitSelect } from '@condo/domains/resident/components/RentalUnitSelect'
import { getRentalUnitDisplayName } from '@condo/domains/resident/utils/clientSchema/rental'


const RENTAL_UNIT_FIELDS = `
    id
    dv
    name
    unitType
    rentable
    capacity
    defaultMonthlyRate
    parent { id name unitType }
    property { id address addressKey }
`

const OCCUPANCY_FIELDS = `
    id
    status
    startDate
    expectedEndDate
    actualEndDate
    monthlyRate
    billingFrequency
    tenant { id user { id name phone } unitName unitType }
    rentalUnit { id name unitType capacity defaultMonthlyRate }
    property { id address addressKey }
`

const GET_RENTAL_WORKSPACE_QUERY = gql`
    query getRentalWorkspace ($propertyId: ID!, $organizationId: ID) {
        rentalUnits: allRentalUnits(
            where: { property: { id: $propertyId }, organization: { id: $organizationId }, deletedAt: null }
            sortBy: [name_ASC]
            first: 200
        ) {
            ${RENTAL_UNIT_FIELDS}
        }
        residents: allResidents(
            where: { property: { id: $propertyId }, organization: { id: $organizationId }, deletedAt: null }
            sortBy: [createdAt_DESC]
            first: 200
        ) {
            id
            unitName
            unitType
            user { id name phone }
            currentOccupancy { id status rentalUnit { id name unitType } }
        }
        summary: propertyOccupancySummary(data: { propertyId: $propertyId, organizationId: $organizationId }) {
            totalRentableUnits
            occupiedUnits
            availableUnits
            totalCapacity
            occupiedCapacity
            availableCapacity
        }
        available: availableRentalUnits(data: { propertyId: $propertyId, organizationId: $organizationId }) {
            items {
                rentalUnit { ${RENTAL_UNIT_FIELDS} }
                capacity
                occupiedCount
                availableCapacity
            }
        }
        hostelBeds: availableHostelBeds(data: { propertyId: $propertyId, organizationId: $organizationId }) {
            items {
                rentalUnit { ${RENTAL_UNIT_FIELDS} }
                capacity
                occupiedCount
                availableCapacity
            }
        }
        occupied: occupiedRentalUnits(data: { propertyId: $propertyId, organizationId: $organizationId }) {
            items {
                occupancy { ${OCCUPANCY_FIELDS} }
                resident { id user { id name phone } unitName unitType }
                rentalUnit { id name unitType capacity defaultMonthlyRate }
                property { id address addressKey }
            }
        }
        arrears: overdueRentalResidents(data: { propertyId: $propertyId, organizationId: $organizationId }) {
            items {
                resident { id user { id name phone } unitName unitType }
                currentOccupancy { ${OCCUPANCY_FIELDS} }
                arrearsTotal
                currencyCode
                chargeCount
            }
        }
    }
`

const CREATE_RENTAL_UNIT_MUTATION = gql`
    mutation createRentalUnitFromWorkspace ($data: RentalUnitCreateInput) {
        obj: createRentalUnit(data: $data) { ${RENTAL_UNIT_FIELDS} }
    }
`

const UPDATE_RENTAL_UNIT_MUTATION = gql`
    mutation updateRentalUnitFromWorkspace ($id: ID!, $data: RentalUnitUpdateInput) {
        obj: updateRentalUnit(id: $id, data: $data) { ${RENTAL_UNIT_FIELDS} }
    }
`

const RESERVE_RENTAL_UNIT_MUTATION = gql`
    mutation reserveRentalUnitFromWorkspace ($data: ReserveRentalUnitInput!) {
        obj: reserveRentalUnit(data: $data) { ${OCCUPANCY_FIELDS} }
    }
`

const CHECK_IN_OCCUPANCY_MUTATION = gql`
    mutation checkInOccupancyFromWorkspace ($data: CheckInOccupancyInput!) {
        result: checkInOccupancy(data: $data) {
            occupancy { ${OCCUPANCY_FIELDS} }
            rentChargeGeneration { createdCount invoiceId }
        }
    }
`

const RENEW_OCCUPANCY_MUTATION = gql`
    mutation renewOccupancyFromWorkspace ($data: RenewOccupancyInput!) {
        obj: renewOccupancy(data: $data) { ${OCCUPANCY_FIELDS} }
    }
`

const TRANSFER_OCCUPANCY_MUTATION = gql`
    mutation transferOccupancyFromWorkspace ($data: TransferOccupancyInput!) {
        result: transferOccupancy(data: $data) {
            previousOccupancy { ${OCCUPANCY_FIELDS} }
            newOccupancy { ${OCCUPANCY_FIELDS} }
            rentChargeGeneration { createdCount invoiceId }
            previousArrears { amount currencyCode chargeCount }
        }
    }
`

const CHECK_OUT_OCCUPANCY_MUTATION = gql`
    mutation checkOutOccupancyFromWorkspace ($data: CheckOutOccupancyInput!) {
        result: checkOutOccupancy(data: $data) {
            occupancy { ${OCCUPANCY_FIELDS} }
            rentChargeGeneration { createdCount invoiceId }
            arrears { amount currencyCode chargeCount }
        }
    }
`

const CANCEL_OCCUPANCY_MUTATION = gql`
    mutation cancelOccupancyFromWorkspace ($data: CancelOccupancyInput!) {
        obj: cancelOccupancy(data: $data) { ${OCCUPANCY_FIELDS} }
    }
`

type RentalsPageContentProps = {
    property: {
        id: string
        address: string
        organization?: { id: string }
    }
    organizationId: string
}

type RentalUnitModalState = {
    mode: 'create' | 'edit'
    unit?: Record<string, unknown>
    parentId?: string
} | null

type LifecycleModalState = {
    action: 'reserve' | 'checkIn' | 'renew' | 'transfer' | 'checkOut' | 'cancel'
    occupancy?: Record<string, unknown>
    rentalUnit?: Record<string, unknown>
} | null

const UNIT_TYPE_OPTIONS = ['apartment', 'house', 'floor', 'room', 'bed'].map(value => ({ value, label: value }))
const BILLING_FREQUENCY_OPTIONS = ['monthly', 'annual'].map(value => ({ value, label: value }))

const formatDate = (value) => value ? dayjs(value).format('YYYY-MM-DD') : undefined

export const RentalsPageContent: React.FC<RentalsPageContentProps> = ({ property, organizationId }) => {
    const intl = useIntl()
    const [unitForm] = Form.useForm()
    const [lifecycleForm] = Form.useForm()
    const [unitModal, setUnitModal] = useState<RentalUnitModalState>(null)
    const [lifecycleModal, setLifecycleModal] = useState<LifecycleModalState>(null)
    const [checkoutResult, setCheckoutResult] = useState<Record<string, unknown> | null>(null)

    const variables = useMemo(() => ({
        propertyId: property.id,
        organizationId,
    }), [organizationId, property.id])

    const { data, loading, refetch } = useQuery(GET_RENTAL_WORKSPACE_QUERY, { variables })
    const [createRentalUnit, createRentalUnitState] = useMutation(CREATE_RENTAL_UNIT_MUTATION)
    const [updateRentalUnit, updateRentalUnitState] = useMutation(UPDATE_RENTAL_UNIT_MUTATION)
    const [reserveRentalUnit, reserveRentalUnitState] = useMutation(RESERVE_RENTAL_UNIT_MUTATION)
    const [checkInOccupancy, checkInOccupancyState] = useMutation(CHECK_IN_OCCUPANCY_MUTATION)
    const [renewOccupancy, renewOccupancyState] = useMutation(RENEW_OCCUPANCY_MUTATION)
    const [transferOccupancy, transferOccupancyState] = useMutation(TRANSFER_OCCUPANCY_MUTATION)
    const [checkOutOccupancy, checkOutOccupancyState] = useMutation(CHECK_OUT_OCCUPANCY_MUTATION)
    const [cancelOccupancy, cancelOccupancyState] = useMutation(CANCEL_OCCUPANCY_MUTATION)

    const rentalUnits = get(data, 'rentalUnits', [])
    const residents = get(data, 'residents', [])
    const summary = get(data, 'summary', {})
    const availableItems = get(data, ['available', 'items'], [])
    const hostelBedItems = get(data, ['hostelBeds', 'items'], [])
    const occupiedItems = get(data, ['occupied', 'items'], [])
    const arrearsItems = get(data, ['arrears', 'items'], [])

    const residentOptions = useMemo(() => residents.map((resident) => {
        const userName = get(resident, ['user', 'name']) || get(resident, ['user', 'phone']) || resident.id
        const currentUnit = getRentalUnitDisplayName(intl, get(resident, ['currentOccupancy', 'rentalUnit']), resident)
        return {
            value: resident.id,
            label: currentUnit ? `${userName} (${currentUnit})` : userName,
        }
    }), [intl, residents])

    useEffect(() => {
        if (!unitModal) {
            unitForm.resetFields()
            return
        }

        const unit = unitModal.unit
        unitForm.setFieldsValue({
            name: get(unit, 'name'),
            unitType: get(unit, 'unitType') || 'apartment',
            parent: unitModal.parentId || get(unit, ['parent', 'id']),
            rentable: get(unit, 'rentable', true),
            capacity: get(unit, 'capacity', 1),
            defaultMonthlyRate: get(unit, 'defaultMonthlyRate'),
        })
    }, [unitForm, unitModal])

    useEffect(() => {
        if (!lifecycleModal) {
            lifecycleForm.resetFields()
            setCheckoutResult(null)
            return
        }

        const occupancy = lifecycleModal.occupancy
        const rentalUnit = lifecycleModal.rentalUnit || get(occupancy, 'rentalUnit')

        lifecycleForm.setFieldsValue({
            occupancyId: get(occupancy, 'id'),
            tenantId: get(occupancy, ['tenant', 'id']),
            rentalUnitId: get(rentalUnit, 'id'),
            targetRentalUnitId: undefined,
            startDate: get(occupancy, 'startDate') ? dayjs(get(occupancy, 'startDate')) : dayjs(),
            expectedEndDate: get(occupancy, 'expectedEndDate') ? dayjs(get(occupancy, 'expectedEndDate')) : undefined,
            actualEndDate: dayjs(),
            transferDate: dayjs(),
            monthlyRate: get(occupancy, 'monthlyRate') || get(rentalUnit, 'defaultMonthlyRate'),
            billingFrequency: get(occupancy, 'billingFrequency') || 'monthly',
            createFinalCharges: true,
        })
    }, [lifecycleForm, lifecycleModal])

    const refetchWorkspace = useCallback(async () => {
        await refetch(variables)
    }, [refetch, variables])

    const handleUnitSubmit = useCallback(async () => {
        const values = await unitForm.validateFields()
        const sender = getClientSideSenderInfo()
        const data = {
            dv: 1,
            sender,
            name: values.name,
            unitType: values.unitType,
            rentable: values.rentable,
            capacity: values.capacity,
            defaultMonthlyRate: values.defaultMonthlyRate ? String(values.defaultMonthlyRate) : null,
            ...(values.parent ? { parent: { connect: { id: values.parent } } } : {}),
        }

        if (unitModal?.mode === 'edit' && get(unitModal, ['unit', 'id'])) {
            await updateRentalUnit({ variables: { id: get(unitModal, ['unit', 'id']), data } })
        } else {
            await createRentalUnit({
                variables: {
                    data: {
                        ...data,
                        organization: { connect: { id: organizationId } },
                        property: { connect: { id: property.id } },
                    },
                },
            })
        }

        setUnitModal(null)
        await refetchWorkspace()
    }, [createRentalUnit, organizationId, property.id, refetchWorkspace, unitForm, unitModal, updateRentalUnit])

    const handleLifecycleSubmit = useCallback(async () => {
        if (lifecycleModal?.action === 'cancel') {
            await cancelOccupancy({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        occupancyId: get(lifecycleModal, ['occupancy', 'id']),
                    },
                },
            })
            setLifecycleModal(null)
            await refetchWorkspace()
            return
        }

        const values = await lifecycleForm.validateFields()
        const baseData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }

        if (lifecycleModal?.action === 'reserve') {
            await reserveRentalUnit({
                variables: {
                    data: {
                        ...baseData,
                        organizationId,
                        propertyId: property.id,
                        tenantId: values.tenantId,
                        rentalUnitId: values.rentalUnitId,
                        startDate: formatDate(values.startDate),
                        expectedEndDate: formatDate(values.expectedEndDate),
                        monthlyRate: values.monthlyRate ? String(values.monthlyRate) : undefined,
                        billingFrequency: values.billingFrequency,
                    },
                },
            })
        }

        if (lifecycleModal?.action === 'checkIn') {
            await checkInOccupancy({
                variables: {
                    data: {
                        ...baseData,
                        occupancyId: values.occupancyId,
                        organizationId,
                        propertyId: property.id,
                        tenantId: values.tenantId,
                        rentalUnitId: values.rentalUnitId,
                        startDate: formatDate(values.startDate),
                        expectedEndDate: formatDate(values.expectedEndDate),
                        monthlyRate: values.monthlyRate ? String(values.monthlyRate) : undefined,
                        billingFrequency: values.billingFrequency,
                    },
                },
            })
        }

        if (lifecycleModal?.action === 'renew') {
            await renewOccupancy({
                variables: {
                    data: {
                        ...baseData,
                        occupancyId: values.occupancyId,
                        expectedEndDate: formatDate(values.expectedEndDate),
                        monthlyRate: values.monthlyRate ? String(values.monthlyRate) : undefined,
                        billingFrequency: values.billingFrequency,
                    },
                },
            })
        }

        if (lifecycleModal?.action === 'transfer') {
            const result = await transferOccupancy({
                variables: {
                    data: {
                        ...baseData,
                        occupancyId: values.occupancyId,
                        targetRentalUnitId: values.targetRentalUnitId,
                        transferDate: formatDate(values.transferDate),
                        expectedEndDate: formatDate(values.expectedEndDate),
                        monthlyRate: values.monthlyRate ? String(values.monthlyRate) : undefined,
                        billingFrequency: values.billingFrequency,
                        createFinalCharges: values.createFinalCharges,
                    },
                },
            })
            setCheckoutResult(get(result, ['data', 'result', 'previousArrears']))
        }

        if (lifecycleModal?.action === 'checkOut') {
            const result = await checkOutOccupancy({
                variables: {
                    data: {
                        ...baseData,
                        occupancyId: values.occupancyId,
                        actualEndDate: formatDate(values.actualEndDate),
                        createFinalCharges: values.createFinalCharges,
                    },
                },
            })
            setCheckoutResult(get(result, ['data', 'result', 'arrears']))
        }

        notification.success({ message: 'Rental operation completed' })
        setLifecycleModal(null)
        await refetchWorkspace()
    }, [cancelOccupancy, checkInOccupancy, checkOutOccupancy, lifecycleForm, lifecycleModal, organizationId, property.id, refetchWorkspace, renewOccupancy, reserveRentalUnit, transferOccupancy])

    const summaryData = useMemo(() => [
        { label: 'Rentable units', value: get(summary, 'totalRentableUnits', 0) },
        { label: 'Occupied units', value: get(summary, 'occupiedUnits', 0) },
        { label: 'Available units', value: get(summary, 'availableUnits', 0) },
        { label: 'Total capacity', value: get(summary, 'totalCapacity', 0) },
        { label: 'Occupied capacity', value: get(summary, 'occupiedCapacity', 0) },
        { label: 'Available capacity', value: get(summary, 'availableCapacity', 0) },
    ], [summary])

    const unitColumns = useMemo(() => [
        {
            title: 'Unit',
            key: 'name',
            render: (_, unit) => getRentalUnitDisplayName(intl, unit),
        },
        { title: 'Parent', dataIndex: ['parent', 'name'], key: 'parent' },
        { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
        {
            title: 'Rentable',
            dataIndex: 'rentable',
            key: 'rentable',
            render: (value) => value ? 'Yes' : 'No',
        },
        { title: 'Monthly rate', dataIndex: 'defaultMonthlyRate', key: 'defaultMonthlyRate' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, unit) => (
                <AntSpace>
                    <Button size='small' type='secondary' onClick={() => setUnitModal({ mode: 'edit', unit })}>Edit</Button>
                    <Button size='small' type='secondary' onClick={() => setUnitModal({ mode: 'create', parentId: unit.id })}>Add child</Button>
                    {unit.rentable && <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'reserve', rentalUnit: unit })}>Reserve</Button>}
                </AntSpace>
            ),
        },
    ], [intl])

    const availabilityColumns = useMemo(() => [
        {
            title: 'Unit',
            key: 'unit',
            render: (_, item) => getRentalUnitDisplayName(intl, item.rentalUnit),
        },
        { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
        { title: 'Occupied', dataIndex: 'occupiedCount', key: 'occupiedCount' },
        { title: 'Available', dataIndex: 'availableCapacity', key: 'availableCapacity' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, item) => (
                <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'reserve', rentalUnit: item.rentalUnit })}>Reserve</Button>
            ),
        },
    ], [intl])

    const occupancyColumns = useMemo(() => [
        {
            title: 'Resident',
            key: 'resident',
            render: (_, item) => get(item, ['resident', 'user', 'name']) || get(item, ['resident', 'user', 'phone']) || '—',
        },
        {
            title: 'Unit',
            key: 'unit',
            render: (_, item) => getRentalUnitDisplayName(intl, item.rentalUnit || get(item, ['occupancy', 'rentalUnit'])),
        },
        { title: 'Status', dataIndex: ['occupancy', 'status'], key: 'status' },
        { title: 'Start', dataIndex: ['occupancy', 'startDate'], key: 'startDate' },
        { title: 'Expected end', dataIndex: ['occupancy', 'expectedEndDate'], key: 'expectedEndDate' },
        { title: 'Rate', dataIndex: ['occupancy', 'monthlyRate'], key: 'monthlyRate' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, item) => (
                <AntSpace wrap>
                    {get(item, ['occupancy', 'status']) === 'planned' && <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'checkIn', occupancy: item.occupancy })}>Check in</Button>}
                    <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'renew', occupancy: item.occupancy })}>Renew</Button>
                    <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'transfer', occupancy: item.occupancy })}>Transfer</Button>
                    <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'checkOut', occupancy: item.occupancy })}>Check out</Button>
                    {get(item, ['occupancy', 'status']) === 'planned' && <Button size='small' type='secondary' onClick={() => setLifecycleModal({ action: 'cancel', occupancy: item.occupancy })}>Cancel</Button>}
                </AntSpace>
            ),
        },
    ], [intl])

    const arrearsColumns = useMemo(() => [
        {
            title: 'Resident',
            key: 'resident',
            render: (_, item) => get(item, ['resident', 'user', 'name']) || get(item, ['resident', 'user', 'phone']) || '—',
        },
        {
            title: 'Unit',
            key: 'unit',
            render: (_, item) => getRentalUnitDisplayName(intl, get(item, ['currentOccupancy', 'rentalUnit']), get(item, 'resident')),
        },
        { title: 'Arrears', dataIndex: 'arrearsTotal', key: 'arrearsTotal' },
        { title: 'Currency', dataIndex: 'currencyCode', key: 'currencyCode' },
        { title: 'Charges', dataIndex: 'chargeCount', key: 'chargeCount' },
    ], [intl])

    const tabs = useMemo(() => [
        {
            key: 'units',
            label: 'Rental units',
            children: <AntTable rowKey='id' loading={loading} dataSource={rentalUnits} columns={unitColumns} pagination={false} />,
        },
        {
            key: 'availability',
            label: 'Availability',
            children: (
                <Space direction='vertical' size={24}>
                    <Typography.Title level={3}>Units</Typography.Title>
                    <AntTable rowKey={(item) => get(item, ['rentalUnit', 'id'])} loading={loading} dataSource={availableItems} columns={availabilityColumns} pagination={false} />
                    <Typography.Title level={3}>Hostel beds</Typography.Title>
                    <AntTable rowKey={(item) => get(item, ['rentalUnit', 'id'])} loading={loading} dataSource={hostelBedItems} columns={availabilityColumns} pagination={false} />
                </Space>
            ),
        },
        {
            key: 'occupancies',
            label: 'Occupancies',
            children: <AntTable rowKey={(item) => get(item, ['occupancy', 'id'])} loading={loading} dataSource={occupiedItems} columns={occupancyColumns} pagination={false} />,
        },
        {
            key: 'arrears',
            label: 'Arrears',
            children: <AntTable rowKey={(item) => get(item, ['resident', 'id'])} loading={loading} dataSource={arrearsItems} columns={arrearsColumns} pagination={false} />,
        },
    ], [arrearsColumns, arrearsItems, availabilityColumns, availableItems, hostelBedItems, loading, occupancyColumns, occupiedItems, rentalUnits, unitColumns])

    const lifecycleLoading = reserveRentalUnitState.loading || checkInOccupancyState.loading || renewOccupancyState.loading ||
        transferOccupancyState.loading || checkOutOccupancyState.loading || cancelOccupancyState.loading

    return (
        <Row gutter={[0, 32]}>
            <Col span={24}>
                <Space direction='vertical' size={8}>
                    <Typography.Title level={1}>Rentals</Typography.Title>
                    <Typography.Text type='secondary'>{property.address}</Typography.Text>
                </Space>
            </Col>
            <Col span={24}>
                <List title='Occupancy summary' dataSource={summaryData} />
            </Col>
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Button key='createUnit' type='primary' onClick={() => setUnitModal({ mode: 'create' })}>Create rental unit</Button>,
                        <Button key='checkIn' type='secondary' onClick={() => setLifecycleModal({ action: 'checkIn' })}>Check in</Button>,
                    ]}
                />
            </Col>
            <Col span={24}>
                <Tabs items={tabs} destroyInactiveTabPane />
            </Col>
            <Modal
                open={!!unitModal}
                title={unitModal?.mode === 'edit' ? 'Edit rental unit' : 'Create rental unit'}
                onCancel={() => setUnitModal(null)}
                onOk={handleUnitSubmit}
                confirmLoading={createRentalUnitState.loading || updateRentalUnitState.loading}
            >
                <Form form={unitForm} layout='vertical'>
                    <Form.Item name='name' label='Name' rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name='unitType' label='Unit type' rules={[{ required: true }]}>
                        <Select options={UNIT_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item name='parent' label='Parent'>
                        <RentalUnitSelect propertyId={property.id} organizationId={organizationId} />
                    </Form.Item>
                    <Form.Item name='rentable' label='Rentable' valuePropName='checked'>
                        <Switch />
                    </Form.Item>
                    <Form.Item name='capacity' label='Capacity' rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name='defaultMonthlyRate' label='Default monthly rate'>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                open={!!lifecycleModal}
                title={lifecycleModal?.action}
                onCancel={() => setLifecycleModal(null)}
                onOk={handleLifecycleSubmit}
                confirmLoading={lifecycleLoading}
            >
                {lifecycleModal?.action === 'cancel' ? (
                    <Typography.Text>Cancel this planned occupancy?</Typography.Text>
                ) : (
                    <Form form={lifecycleForm} layout='vertical'>
                        <Form.Item name='occupancyId' hidden><Input /></Form.Item>
                        {['reserve', 'checkIn'].includes(lifecycleModal?.action) && (
                            <Form.Item name='tenantId' label='Resident' rules={[{ required: true }]}>
                                <Select showSearch options={residentOptions} optionFilterProp='label' />
                            </Form.Item>
                        )}
                        {['reserve', 'checkIn'].includes(lifecycleModal?.action) && (
                            <Form.Item name='rentalUnitId' label='Rental unit' rules={[{ required: true }]}>
                                <RentalUnitSelect propertyId={property.id} organizationId={organizationId} rentableOnly />
                            </Form.Item>
                        )}
                        {lifecycleModal?.action === 'transfer' && (
                            <Form.Item name='targetRentalUnitId' label='Target rental unit' rules={[{ required: true }]}>
                                <RentalUnitSelect propertyId={property.id} organizationId={organizationId} rentableOnly />
                            </Form.Item>
                        )}
                        {['reserve', 'checkIn'].includes(lifecycleModal?.action) && (
                            <Form.Item name='startDate' label='Start date' rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                        {lifecycleModal?.action === 'transfer' && (
                            <Form.Item name='transferDate' label='Transfer date' rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                        {lifecycleModal?.action === 'checkOut' && (
                            <Form.Item name='actualEndDate' label='Actual end date' rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                        {['reserve', 'checkIn', 'renew', 'transfer'].includes(lifecycleModal?.action) && (
                            <Form.Item name='expectedEndDate' label='Expected end date'>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                        {['reserve', 'checkIn', 'renew', 'transfer'].includes(lifecycleModal?.action) && (
                            <Form.Item name='monthlyRate' label='Monthly rate'>
                                <Input />
                            </Form.Item>
                        )}
                        {['reserve', 'checkIn', 'renew', 'transfer'].includes(lifecycleModal?.action) && (
                            <Form.Item name='billingFrequency' label='Billing frequency'>
                                <Select options={BILLING_FREQUENCY_OPTIONS} />
                            </Form.Item>
                        )}
                        {['transfer', 'checkOut'].includes(lifecycleModal?.action) && (
                            <Form.Item name='createFinalCharges' label='Create final charges' valuePropName='checked'>
                                <Switch />
                            </Form.Item>
                        )}
                        {checkoutResult && (
                            <Typography.Text type='secondary'>
                                Arrears: {get(checkoutResult, 'amount')} {get(checkoutResult, 'currencyCode')} ({get(checkoutResult, 'chargeCount')} charges)
                            </Typography.Text>
                        )}
                    </Form>
                )}
            </Modal>
        </Row>
    )
}

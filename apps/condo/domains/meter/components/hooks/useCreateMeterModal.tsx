import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import React, { useEffect, useState } from 'react'
import { StoreValue } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { ResourcesList } from '../createMeterModal/ResourcesList'
import { MeterInfo } from '../createMeterModal/MeterInfo'

type CreateMeterModalProps = {
    addMeterToFormAction: (defaultValue?: StoreValue, insertIndex?: number) => void
}

export const useCreateMeterModal = ()=> {
    const intl = useIntl()

    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const [selectedMeterResource, setSelectedMeterResource] = useState<string | null>(null)

    useEffect(() => {
        setSelectedMeterResource(null)
    }, [isCreateMeterModalVisible])

    const CreateMeterModal = ({ addMeterToFormAction }: CreateMeterModalProps) => (
        <BaseModalForm
            visible={isCreateMeterModalVisible}
            cancelModal={() => setIsCreateMeterModalVisible(false)}
            ModalTitleMsg={'Добавить счетчик'}
            ModalSaveButtonLabelMsg={'Добавить'}
            showCancelButton={false}
            validateTrigger={['onBlur', 'onSubmit']}
            handleSubmit={
                (values) => {
                    addMeterToFormAction(values)
                    setIsCreateMeterModalVisible(false)
                }
            }
        >
            {
                !selectedMeterResource ? (
                    <ResourcesList setSelectedMeterResource={setSelectedMeterResource} />
                ) : (
                    <MeterInfo resourceId={selectedMeterResource} />
                )
            }
        </BaseModalForm>
    )

    return {
        CreateMeterModal,
        setIsCreateMeterModalVisible,
    }
}
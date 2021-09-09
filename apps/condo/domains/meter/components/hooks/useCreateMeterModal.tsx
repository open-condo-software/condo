import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import React, { useEffect, useState } from 'react'
import { StoreValue } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { ResourcesList } from '../createMeterModal/ResourcesList'
import { MeterInfo } from '../createMeterModal/MeterInfo'
import { MeterResource, resourceIdToCreateMeterTitleId } from '../../utils/clientSchema'
import { Loader } from '../../../common/components/Loader'
import { FormattedMessage } from 'react-intl'

type MeterInfoModalTitleProps = {
    resourceId: string
}

const MeterInfoModalTitle = ({ resourceId }: MeterInfoModalTitleProps) => {
    const intl = useIntl()
    const ResourceTitle = intl.formatMessage({ id: resourceIdToCreateMeterTitleId[resourceId] })

    return (
        <FormattedMessage
            id='pages.condo.meter.AddMeterModalTitleTemplate'
            values={{
                resource: ResourceTitle,
            }}
        />
    )
}

type CreateMeterModalProps = {
    addMeterToFormAction: (defaultValue?: StoreValue, insertIndex?: number) => void
}

export const useCreateMeterModal = ()=> {
    const intl = useIntl()
    const ChooseServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.ChooseService' })
    const AddMessage = intl.formatMessage({ id: 'Add' })

    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const [selectedMeterResourceId, setSelectedMeterResourceId] = useState<string | null>(null)

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    useEffect(() => {
        setSelectedMeterResourceId(null)
    }, [isCreateMeterModalVisible])

    const CreateMeterModal = ({ addMeterToFormAction }: CreateMeterModalProps) => (
        <BaseModalForm
            visible={isCreateMeterModalVisible}
            cancelModal={() => setIsCreateMeterModalVisible(false)}
            ModalTitleMsg={
                !selectedMeterResourceId ?
                    ChooseServiceMessage :
                    <MeterInfoModalTitle resourceId={selectedMeterResourceId} />
            }
            ModalSaveButtonLabelMsg={AddMessage}
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
                resourcesLoading ? <Loader /> :
                    !selectedMeterResourceId ? (
                        <ResourcesList
                            resources={resources}
                            setSelectedMeterResource={setSelectedMeterResourceId}
                        />
                    ) : (
                        <MeterInfo
                            resource={resources.find(resource => resource.id === selectedMeterResourceId)}
                        />
                    )
            }
        </BaseModalForm>
    )

    return {
        CreateMeterModal,
        setIsCreateMeterModalVisible,
    }
}
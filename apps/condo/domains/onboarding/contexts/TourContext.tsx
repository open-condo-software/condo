import { useGetTourStepsLazyQuery, useSyncTourStepsMutation, useUpdateTourStepMutation } from '@app/condo/gql'
import { TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { MUTATION_RESULT_EVENT, MutationEmitter } from '@open-condo/next/_useEmitterMutation'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { IMPORT_EVENT, ImportEmitter } from '@condo/domains/common/components/Import/Index'
import { ACTIVE_STEPS_STORAGE_KEY, FIRST_LEVEL_STEPS, STEP_TYPES } from '@condo/domains/onboarding/constants/steps'
import { useCompletedTourModals } from '@condo/domains/onboarding/hooks/TourContext/useCompletedTourModals'
import { MANAGING_COMPANY_TYPE } from '@condo/domains/organization/constants/common'


type ActiveTourStepType = typeof FIRST_LEVEL_STEPS[number] | null

type TourContextType = {
    activeTourStep: ActiveTourStepType
    setActiveTourStep: (stepType: typeof STEP_TYPES) => void
    updateStepIfNotCompleted: (stepType: string) => Promise<void>
    syncLoading: boolean
}

const initialActiveTourStepValue: ActiveTourStepType = null

const TourContext = createContext<TourContextType>({
    activeTourStep: initialActiveTourStepValue,
    setActiveTourStep: () => { return },
    updateStepIfNotCompleted: () => { return Promise.resolve() },
    syncLoading: true,
})

const getActiveTourStepFromStorage = (): ActiveTourStepType => {
    if (typeof window === 'undefined') return

    try {
        return localStorage.getItem(ACTIVE_STEPS_STORAGE_KEY)
    } catch (e) {
        console.error('Failed to parse initial activeTourStep from LocalStorage')
    }
}

export const TourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, isLoading: userIsLoading } = useAuth()
    const { organization, isLoading: organizationIsLoading } = useOrganization()
    const organizationId = organization?.id || null
    const organizationType = organization?.type || null

    const [getTourSteps, {
        refetch: refetchSteps,
    }] = useGetTourStepsLazyQuery({
        variables: {
            where: {
                organization: {
                    id: organizationId,
                },
            },
        },
    })

    const [updateTourStep] = useUpdateTourStepMutation({
        onCompleted: async () => await refetchSteps(),
    })

    const [syncTourStepMutation, { loading: syncLoading }] = useSyncTourStepsMutation({
        variables: {
            data: {
                organization: { id: organizationId },
                dv: 1,
                sender: getClientSideSenderInfo(),
            },
        },
        onCompleted: async () => {
            if (organizationId) {
                await refetchSteps()
            }
        },
    })

    useEffect(() => {
        if (!organizationId || !user || userIsLoading || organizationIsLoading) return

        syncTourStepMutation()
    }, [organizationId, organizationIsLoading, syncTourStepMutation, user, userIsLoading])

    const [activeStep, setActiveStep] = useState<ActiveTourStepType>(getActiveTourStepFromStorage())

    const currentImport = useRef<{ domain: string, status: string }>()
    const isFirstSuccessImport = useRef<boolean>()

    const setActiveTourStep = useCallback((type) => {
        try {
            if (!type) {
                localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
                setActiveStep(null)
            } else {
                localStorage.setItem(ACTIVE_STEPS_STORAGE_KEY, type)
                setActiveStep(type)
            }
        } catch (e) {
            localStorage && localStorage.removeItem(ACTIVE_STEPS_STORAGE_KEY)
            setActiveStep(null)
            console.error('Failed to set activeTourStep in LocalStorage')
        }
    }, [])

    const {
        updateCompletedStepModalData,
        CompletedStepModal,
        CompletedFlowModal,
    } = useCompletedTourModals({ activeStep, setActiveTourStep, refetchSteps })

    const updateStepIfNotCompleted = useCallback(async (type: TourStepTypeType, nextRoute?: string) => {
        if (organizationType !== MANAGING_COMPANY_TYPE) return

        const {
            data: tourStepData,
        } = await getTourSteps({
            variables: {
                where: {
                    organization: { id: organizationId },
                    type,
                },
            },
        })
        const tourStep = tourStepData?.tourSteps.filter(Boolean)[0] || null

        if (!tourStep) return

        if (tourStep.status === TourStepStatusType.Completed) {
            return
        }

        await updateTourStep({
            variables: {
                id: tourStep.id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    status: TourStepStatusType.Completed,
                },
            },
        })

        // meter readings has back-end import, for this case we pass isFirstSuccessImport manually and here open complete step modal
        if (currentImport.current && type !== TourStepTypeType.CreateMeterReadings) {
            isFirstSuccessImport.current = true
        } else {
            updateCompletedStepModalData(type, nextRoute)
        }
    }, [organizationId, organizationType, getTourSteps, updateCompletedStepModalData, updateTourStep])

    useEffect(() => {
        const mutationHandler = async ({ data, name }) => {
            switch (name) {
                case 'createProperty': {
                    if (currentImport.current && isFirstSuccessImport.current) return
                    if (data?.obj?.map) {
                        await updateStepIfNotCompleted(TourStepTypeType.CreateProperty)
                        await updateStepIfNotCompleted(TourStepTypeType.CreatePropertyMap)
                    } else {
                        await updateStepIfNotCompleted(TourStepTypeType.CreateProperty, `/property/${data?.obj?.id}/map/update`)
                    }

                    break
                }

                case 'updateProperty': {
                    if (!data?.obj?.map) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreatePropertyMap)
                    break
                }

                case 'createTicket': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreateTicket)
                    break
                }

                case 'createMeter': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreateMeter)
                    break
                }

                case 'createMeterReading': {
                    if (currentImport.current && isFirstSuccessImport.current) return

                    await updateStepIfNotCompleted(TourStepTypeType.CreateMeterReadings)
                    break
                }

                case 'createNewsItem': {
                    await updateStepIfNotCompleted(TourStepTypeType.CreateNews)
                    break
                }
            }
        }

        const importHandler = async ({ domain, status }) => {
            currentImport.current = { domain, status }

            if (status === 'complete-import') {
                isFirstSuccessImport.current = true
            }

            if (status === null && isFirstSuccessImport.current) {
                switch (domain) {
                    case 'property': {
                        updateCompletedStepModalData('importProperties')
                        break
                    }
                    case 'meter': {
                        await updateStepIfNotCompleted(TourStepTypeType.CreateMeterReadings)
                        break
                    }
                    case 'ticket': {
                        updateCompletedStepModalData(TourStepTypeType.CreateTicket)
                        break
                    }
                }

                currentImport.current = null
                isFirstSuccessImport.current = false
            }
        }

        MutationEmitter.addListener(MUTATION_RESULT_EVENT, mutationHandler)
        ImportEmitter.addListener(IMPORT_EVENT, importHandler)

        return () => {
            MutationEmitter.removeListener(MUTATION_RESULT_EVENT, mutationHandler)
            ImportEmitter.removeListener(IMPORT_EVENT, importHandler)
        }
    }, [activeStep, updateCompletedStepModalData, updateStepIfNotCompleted])

    const contextValue = useMemo(() => ({
        activeTourStep: activeStep,
        setActiveTourStep,
        updateStepIfNotCompleted,
        syncLoading,
    }), [activeStep, setActiveTourStep, syncLoading, updateStepIfNotCompleted])

    return (
        <>
            <TourContext.Provider
                value={contextValue}
            >
                {children}
            </TourContext.Provider>
            {CompletedStepModal}
            {CompletedFlowModal}
        </>
    )
}

export const useTourContext = (): TourContextType => useContext(TourContext)
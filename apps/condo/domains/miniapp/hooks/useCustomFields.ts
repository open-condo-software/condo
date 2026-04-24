
import { useGetCustomValuesForObjectQuery } from '@app/condo/gql'
import { CustomFieldModelNameType } from '@app/condo/schema'

type UseCustomValuesProps = {
    modelName: CustomFieldModelNameType
    objectId: string
    skip?: boolean
}

export function useCustomValues ({
    modelName,
    objectId,
    skip = false,
}: UseCustomValuesProps) {
    const {
        loading,
        error,
        data,
        refetch,
    } = useGetCustomValuesForObjectQuery({
        variables: {
            modelName: modelName,
            itemId: objectId,
        },
        skip: skip || !objectId,
    })

    const customValues = data?.customValues || []

    return {
        loading,
        error,
        data,
        customValues,
        refetch,
    }
}

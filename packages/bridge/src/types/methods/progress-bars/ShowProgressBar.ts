export type TrackableCondoTaskSchemaName = 'NewsItemRecipientsExportTask'

export type ShowProgressBarParams = {
    message: string
    description?: string
    externalTaskId?: string
    /**
     * When set together with `externalTaskId`, the host tracks this condo task
     * (poll + file download) instead of creating a MiniAppTask.
     * Unknown / omitted values keep the MiniAppTask behaviour.
     */
    schemaName?: TrackableCondoTaskSchemaName
}

export type ShowProgressBarData = {
    barId: string
}
import React from 'react'

export type BaseEventProperties = {
    page: {
        path: string
    }
    user: {
        sessionId: string
    }
}

export enum AmplitudeEventType {
    VisitBillingAppListPage = 'VisitBillingAppListPage',
    VisitBillingPage = 'VisitBillingPage',
    VisitBillingAboutPage = 'VisitBillingAboutPage',
    OpenDescriptionLink = 'OpenDescriptionLink',
}

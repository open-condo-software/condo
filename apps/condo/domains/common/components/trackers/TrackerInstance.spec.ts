import { faker } from '@faker-js/faker'

import TrackerInstance, { ITrackerLogEventType } from './TrackerInstance'

const TRACKER_DOMAIN = faker.datatype.string().replace(/\//g, '')
const TRACKER_DOMAIN_PAGES = ['id', 'about', 'create', 'update']
const TRACKER_INSTANCE_NAME = faker.datatype.string()

const TRACKING_CONFIG = {
    domains: {
        [TRACKER_DOMAIN]: TRACKER_DOMAIN_PAGES,
    },
    trackers: {
        [TRACKER_INSTANCE_NAME]: {
            token: faker.datatype.string(),
            config: {},
        },
    },
}

class MockTracker extends TrackerInstance {
    constructor (instanceName: string, localConfig?: Record<string, unknown>) {
        const config = {
            publicRuntimeConfig: { trackingConfig: localConfig },
        }
        super(instanceName, config)
    }
    init (): void {
        this.instance = {}
    }

    logInstanceEvent ({ eventName, eventProperties, denyDuplicates }: ITrackerLogEventType): void {
        void 0
    }
}

describe('TrackerInstance', () => {
    describe('isNeedToSendEvent', () => {
        describe('Restrict sending events', () => {
            it('without config provided', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME)

                expect(trackerInstance.logEvent({
                    eventName,
                })).toBeFalsy()
            })

            it('without token', () => {
                const notAllowedTracker = faker.datatype.string()
                const trackerInstance = new MockTracker(notAllowedTracker, TRACKING_CONFIG)
                const eventName = faker.datatype.string()

                trackerInstance.init()

                expect(trackerInstance.logEvent({
                    eventName,
                })).toBeFalsy()

            })
        })

        describe('Allow sending events', () => {
            it('when config was provided', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME, TRACKING_CONFIG)
                trackerInstance.init()

                const trackerProps: ITrackerLogEventType = {
                    eventName,
                    eventProperties: {
                        page: {
                            path: `/${TRACKER_DOMAIN}`,
                        },
                    },
                }

                expect(trackerInstance.logEvent(trackerProps)).toBeTruthy()
            })

            it('when event was sent from detail page', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME, TRACKING_CONFIG)
                trackerInstance.init()

                const trackerProps: ITrackerLogEventType = {
                    eventName,
                    eventProperties: {
                        page: {
                            path: `/${TRACKER_DOMAIN}/${faker.datatype.uuid()}`,
                        },
                    },
                }

                expect(trackerInstance.logEvent(trackerProps)).toBeTruthy()
            })

            it('when event was sent from create page', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME, TRACKING_CONFIG)
                trackerInstance.init()

                const trackerProps: ITrackerLogEventType = {
                    eventName,
                    eventProperties: {
                        page: {
                            path: `/${TRACKER_DOMAIN}/create`,
                        },
                    },
                }

                expect(trackerInstance.logEvent(trackerProps)).toBeTruthy()
            })

            it('when event was sent from update page', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME, TRACKING_CONFIG)
                trackerInstance.init()

                const trackerProps: ITrackerLogEventType = {
                    eventName,
                    eventProperties: {
                        page: {
                            path: `/${TRACKER_DOMAIN}/${faker.datatype.uuid()}/update`,
                        },
                    },
                }

                expect(trackerInstance.logEvent(trackerProps)).toBeTruthy()
            })

            it('when event was sent from page with search params', () => {
                const eventName = faker.datatype.string()
                const trackerInstance = new MockTracker(TRACKER_INSTANCE_NAME, TRACKING_CONFIG)
                trackerInstance.init()

                const trackerProps: ITrackerLogEventType = {
                    eventName,
                    eventProperties: {
                        page: {
                            path: `/${TRACKER_DOMAIN}/?arg=0&filter=[]`,
                        },
                    },
                }

                expect(trackerInstance.logEvent(trackerProps)).toBeTruthy()
            })

        })
    })
})

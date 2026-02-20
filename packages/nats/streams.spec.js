const { StreamRegistry, buildSubject } = require('./streams')

function createMockJsm () {
    const store = new Map()

    return {
        streams: {
            async add (config) {
                if (store.has(config.name)) {
                    throw new Error(`stream name already in use: "${config.name}"`)
                }
                store.set(config.name, { config: { ...config } })
                return { config: { ...config } }
            },
            async update (config) {
                if (!store.has(config.name)) {
                    throw new Error(`stream not found: "${config.name}"`)
                }
                store.set(config.name, { config: { ...config } })
                return { config: { ...config } }
            },
            async info (name) {
                if (!store.has(name)) {
                    throw new Error(`stream not found: "${name}"`)
                }
                return store.get(name)
            },
            async delete (name) {
                if (!store.has(name)) {
                    throw new Error(`stream not found: "${name}"`)
                }
                store.delete(name)
                return true
            },
        },
        _store: store,
    }
}

function createMockNatsClient (jsm) {
    return {
        connection: {
            jetstreamManager: async () => jsm,
        },
    }
}

describe('StreamRegistry', () => {
    describe('register / unregister', () => {
        it('registers a stream with defaults', () => {
            const registry = new StreamRegistry()
            const config = registry.register('test-changes', { ttl: 600 })

            expect(config.name).toBe('test-changes')
            expect(config.ttl).toBe(600)
            expect(config.subjects).toEqual(['test-changes.>'])
            expect(config.storage).toBe('memory')
            expect(config.retention).toBe('interest')
            expect(registry.get('test-changes')).toBe(config)
        })

        it('registers a stream with custom subjects', () => {
            const registry = new StreamRegistry()
            const config = registry.register('test-events', {
                subjects: ['test-events.>'],
                storage: 'file',
                retention: 'limits',
            })

            expect(config.subjects).toEqual(['test-events.>'])
            expect(config.storage).toBe('file')
            expect(config.retention).toBe('limits')
        })

        it('rejects invalid stream names', () => {
            const registry = new StreamRegistry()

            expect(() => registry.register('InvalidName', {}))
                .toThrow('Invalid stream name')
            expect(() => registry.register('no-suffix', {}))
                .toThrow('Invalid stream name')
            expect(() => registry.register('ab', {}))
                .toThrow('Invalid stream name')
        })

        it('rejects subjects not starting with stream name', () => {
            const registry = new StreamRegistry()

            expect(() => registry.register('test-changes', {
                subjects: ['other-stream.>'],
            })).toThrow('must start with stream name')
        })

        it('unregisters a stream', () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', {})

            expect(registry.unregister('test-changes')).toBe(true)
            expect(registry.get('test-changes')).toBeUndefined()
        })

        it('unregister returns false for non-existent stream', () => {
            const registry = new StreamRegistry()
            expect(registry.unregister('non-existent-changes')).toBe(false)
        })

        it('getAll returns all registered streams', () => {
            const registry = new StreamRegistry()
            registry.register('alpha-changes', {})
            registry.register('beta-events', {})

            const all = registry.getAll()
            expect(all).toHaveLength(2)
            expect(all.map(s => s.name).sort()).toEqual(['alpha-changes', 'beta-events'])
        })
    })

    describe('initializeAll', () => {
        it('creates new streams in JetStream', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', { ttl: 3600 })
            registry.register('test-events', { ttl: 1800 })

            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            const result = await registry.initializeAll(client)

            expect(result.created.sort()).toEqual(['test-changes', 'test-events'])
            expect(result.updated).toEqual([])
            expect(result.upToDate).toEqual([])
            expect(result.failed).toEqual([])

            const info = await jsm.streams.info('test-changes')
            expect(info.config.max_age).toBe(3600 * 1e9)
        })

        it('detects streams that are up to date', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', { ttl: 3600 })

            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            await registry.initializeAll(client)
            const result = await registry.initializeAll(client)

            expect(result.created).toEqual([])
            expect(result.upToDate).toEqual(['test-changes'])
        })

        it('updates streams when TTL changes', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', { ttl: 3600 })

            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            await registry.initializeAll(client)

            registry.unregister('test-changes')
            registry.register('test-changes', { ttl: 7200 })

            const result = await registry.initializeAll(client)

            expect(result.updated).toEqual(['test-changes'])
            expect(result.created).toEqual([])

            const info = await jsm.streams.info('test-changes')
            expect(info.config.max_age).toBe(7200 * 1e9)
        })

        it('updates streams when subjects change', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', {
                subjects: ['test-changes.>'],
            })

            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            await registry.initializeAll(client)

            registry.unregister('test-changes')
            registry.register('test-changes', {
                subjects: ['test-changes.>'],
                retention: 'limits',
            })

            const result = await registry.initializeAll(client)

            expect(result.updated).toEqual(['test-changes'])
            const info = await jsm.streams.info('test-changes')
            expect(info.config.retention).toBe('limits')
        })

        it('returns empty result when client is not connected', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', {})

            const result = await registry.initializeAll(null)

            expect(result).toEqual({ created: [], updated: [], upToDate: [], failed: [] })
        })

        it('reports failed streams without stopping others', async () => {
            const registry = new StreamRegistry()
            registry.register('good-changes', { ttl: 3600 })
            registry.register('bad-events', { ttl: 3600 })

            const jsm = createMockJsm()
            const origAdd = jsm.streams.add.bind(jsm.streams)
            jsm.streams.add = async (config) => {
                if (config.name === 'bad-events') {
                    throw new Error('Simulated JetStream error')
                }
                return origAdd(config)
            }

            const client = createMockNatsClient(jsm)
            const result = await registry.initializeAll(client)

            expect(result.created).toEqual(['good-changes'])
            expect(result.failed).toEqual(['bad-events'])
        })
    })

    describe('deleteStream', () => {
        it('deletes a stream from JetStream and registry', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', { ttl: 3600 })

            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            await registry.initializeAll(client)
            expect(await jsm.streams.info('test-changes')).toBeDefined()

            const deleted = await registry.deleteStream(client, 'test-changes')

            expect(deleted).toBe(true)
            expect(registry.get('test-changes')).toBeUndefined()
            await expect(jsm.streams.info('test-changes')).rejects.toThrow('stream not found')
        })

        it('returns false when stream does not exist in JetStream', async () => {
            const registry = new StreamRegistry()
            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            const deleted = await registry.deleteStream(client, 'non-existent-changes')
            expect(deleted).toBe(false)
        })

        it('returns false when client is not connected', async () => {
            const registry = new StreamRegistry()
            registry.register('test-changes', {})

            const deleted = await registry.deleteStream(null, 'test-changes')
            expect(deleted).toBe(false)
        })
    })

    describe('full lifecycle: create → update → delete', () => {
        it('handles complete stream lifecycle', async () => {
            const registry = new StreamRegistry()
            const jsm = createMockJsm()
            const client = createMockNatsClient(jsm)

            // Create
            registry.register('lifecycle-events', { ttl: 3600 })
            const createResult = await registry.initializeAll(client)
            expect(createResult.created).toEqual(['lifecycle-events'])

            const created = await jsm.streams.info('lifecycle-events')
            expect(created.config.max_age).toBe(3600 * 1e9)
            expect(created.config.retention).toBe('interest')

            // Update TTL and retention
            registry.unregister('lifecycle-events')
            registry.register('lifecycle-events', { ttl: 7200, retention: 'limits' })
            const updateResult = await registry.initializeAll(client)
            expect(updateResult.updated).toEqual(['lifecycle-events'])

            const updated = await jsm.streams.info('lifecycle-events')
            expect(updated.config.max_age).toBe(7200 * 1e9)
            expect(updated.config.retention).toBe('limits')

            // No-op re-run
            const noop = await registry.initializeAll(client)
            expect(noop.upToDate).toEqual(['lifecycle-events'])

            // Delete
            const deleted = await registry.deleteStream(client, 'lifecycle-events')
            expect(deleted).toBe(true)
            expect(registry.get('lifecycle-events')).toBeUndefined()
            await expect(jsm.streams.info('lifecycle-events')).rejects.toThrow()
        })
    })
})

describe('buildSubject', () => {
    it('builds a subject from stream name and tokens', () => {
        expect(buildSubject('ticket-changes', 'org-1', 'ticket-1')).toBe('ticket-changes.org-1.ticket-1')
    })

    it('builds a wildcard subject', () => {
        expect(buildSubject('ticket-changes', 'org-1', '>')).toBe('ticket-changes.org-1.>')
    })

    it('builds a stream-only subject', () => {
        expect(buildSubject('notification-events', '>')).toBe('notification-events.>')
    })

    it('returns just stream name when no tokens', () => {
        expect(buildSubject('test-changes')).toBe('test-changes')
    })

    it('throws on invalid stream name', () => {
        expect(() => buildSubject('INVALID', 'org-1')).toThrow()
        expect(() => buildSubject('no-suffix', 'org-1')).toThrow()
    })

    it('throws on invalid subject pattern', () => {
        expect(() => buildSubject('ticket-changes', 'ORG WITH SPACES')).toThrow()
    })
})

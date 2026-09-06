/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

// Mock capture fn — declared before requires so jest.mock factories can reference it
const mockExecute = jest.fn()
const mockSudoContext = { skipAccessControl: true }
const mockKeystoneContext = {
    createContext: jest.fn().mockReturnValue(mockSudoContext),
}

const { getUserAISkillsFilter } = require('@condo/domains/ai/access/AISkill')
const { TASK_STATUSES } = require('@condo/domains/ai/constants')
const { executeAIFlow } = require('@condo/domains/ai/tasks/executeAIFlow')
const { ExecutionAIFlowTask, AISkill } = require('@condo/domains/ai/utils/serverSchema')


// --- Mocks (hoisted by Jest before requires) ---

jest.mock('@condo/domains/ai/adapters', () => {
    const MockAdapter = jest.fn().mockImplementation(() => ({
        isConfigured: true,
        execute: mockExecute,
    }))
    return { FlowiseAdapter: MockAdapter, N8NAdapter: MockAdapter }
})

// Mock serverSchema (auto-mock — every method becomes jest.fn())
jest.mock('@condo/domains/ai/utils/serverSchema')

// Mock access filter
jest.mock('@condo/domains/ai/access/AISkill')

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockReturnValue({ keystone: mockKeystoneContext }),
}))

// Mock KV client — accessSchema.js initializes a Redis client at module load
jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn().mockReturnValue({}),
}))

// Mock flowsConfig — adapter is mocked, so predictionUrl is never called
jest.mock('@condo/domains/ai/utils/flowsConfig', () => ({
    CUSTOM_FLOW_TYPES_LIST: ['success_flow', 'rewrite_text_flow'],
    AI_FLOWS_CONFIG: {
        custom: {
            success_flow: { adapter: 'flowise', predictionUrl: 'mock://success' },
            rewrite_text_flow: { adapter: 'flowise', predictionUrl: 'mock://success' },
        },
    },
}))

// Mock messaging
jest.mock('@open-condo/messaging', () => ({
    buildUserTopic: jest.fn().mockReturnValue('test-topic'),
    publish: jest.fn().mockResolvedValue(undefined),
}))

// Mock other heavy deps that are not relevant to skill resolution
jest.mock('@open-condo/files/schema/utils/serverSchema', () => ({
    FileRecord: { getOne: jest.fn() },
}))
jest.mock('@open-condo/keystone/fileAdapter/fileAdapter', () => {
    return jest.fn().mockImplementation(() => ({ publicUrl: jest.fn() }))
})
jest.mock('@open-condo/keystone/logging', () => ({ getLogger: () => ({ error: jest.fn() }) }))
jest.mock('@open-condo/keystone/apolloErrorFormatter', () => ({ safeFormatError: jest.fn((e) => ({ message: e.message })) }))
jest.mock('@open-condo/locales/loader', () => ({ i18n: jest.fn(() => 'translated') }))


// --- Helpers ---

const PREDICTION_RESULT = { answer: 'mocked answer' }

function makeSkill (overrides = {}) {
    return {
        id: faker.datatype.uuid(),
        name: 'test-skill',
        description: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        ...overrides,
    }
}

function makeTask (overrides = {}) {
    const skillIds = overrides._skillIds || []
    const cleanContext = { ...overrides._cleanContext }
    if (skillIds.length > 0) {
        cleanContext.selectedSkillIds = skillIds
    }

    return {
        id: faker.datatype.uuid(),
        flowType: overrides.flowType || 'success_flow',
        context: cleanContext,
        cleanContext,
        locale: 'en',
        status: TASK_STATUSES.PROCESSING,
        user: { id: overrides._userId || faker.datatype.uuid() },
        aiSessionId: null,
        deletedAt: null,
        ...overrides._taskFields,
    }
}

async function runExecuteAIFlow (task) {
    mockExecute.mockResolvedValue({
        result: PREDICTION_RESULT,
        _response: PREDICTION_RESULT,
    })
    return executeAIFlow(task)
}


// --- Tests ---

describe('executeAIFlow — skill resolution', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getUserAISkillsFilter.mockResolvedValue({ isPublic: true })
        ExecutionAIFlowTask.update.mockResolvedValue(null)
    })

    test('resolves skill content and injects as context.skills', async () => {
        const skill = makeSkill({ license: 'MIT', compatibility: '>=1.0', allowedTools: 'tool1,tool2' })
        const userId = faker.datatype.uuid()
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({
            _userId: userId,
            _skillIds: [skill.id],
            _cleanContext: { userInput: 'hello' },
        })

        await runExecuteAIFlow(task)

        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills).toHaveLength(1)
        expect(receivedContext.skills[0]).toEqual({
            name: skill.name,
            description: skill.description,
            content: skill.content,
            license: skill.license,
            compatibility: skill.compatibility,
            'allowed-tools': skill.allowedTools,
        })
        // selectedSkillIds must be removed from context sent to adapter
        expect(receivedContext.selectedSkillIds).toBeUndefined()
    })

    test('injects skills without optional fields when skill lacks them', async () => {
        const skill = makeSkill()
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({ _skillIds: [skill.id] })

        await runExecuteAIFlow(task)

        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills[0]).toEqual({
            name: skill.name,
            description: skill.description,
            content: skill.content,
        })
        expect(receivedContext.skills[0]).not.toHaveProperty('license')
        expect(receivedContext.skills[0]).not.toHaveProperty('compatibility')
        expect(receivedContext.skills[0]).not.toHaveProperty('allowed-tools')
    })

    test('injects metadata when skill has it', async () => {
        const skill = makeSkill({ metadata: { key: 'value' } })
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({ _skillIds: [skill.id] })

        await runExecuteAIFlow(task)

        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills[0].metadata).toEqual({ key: 'value' })
    })

    test('throws "Skill not found or access denied" when skill does not exist', async () => {
        AISkill.getAll.mockResolvedValue([])

        const task = makeTask({ _skillIds: [faker.datatype.uuid()] })

        await expect(runExecuteAIFlow(task)).rejects.toThrow('Skill not found or access denied')
    })

    test('throws when user lacks access to a requested skill (count mismatch)', async () => {
        const skill = makeSkill()
        const inaccessibleSkillId = faker.datatype.uuid()
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({ _skillIds: [skill.id, inaccessibleSkillId] })

        await expect(runExecuteAIFlow(task)).rejects.toThrow('Skill not found or access denied')
    })

    test('does not resolve skills when selectedSkillIds is empty', async () => {
        const task = makeTask({ _skillIds: [], _cleanContext: { userInput: 'hello' } })

        await runExecuteAIFlow(task)

        expect(AISkill.getAll).not.toHaveBeenCalled()
        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills).toBeUndefined()
    })

    test('does not resolve skills when selectedSkillIds is absent', async () => {
        const task = makeTask({ _cleanContext: { userInput: 'hello' } })

        await runExecuteAIFlow(task)

        expect(AISkill.getAll).not.toHaveBeenCalled()
        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills).toBeUndefined()
        expect(receivedContext.selectedSkillIds).toBeUndefined()
    })

    test('works with any flowType (generic, not chat-with-condo specific)', async () => {
        const skill = makeSkill()
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({
            flowType: 'rewrite_text_flow',
            _skillIds: [skill.id],
        })

        await runExecuteAIFlow(task)

        const receivedContext = mockExecute.mock.calls[0][1]
        expect(receivedContext.skills).toHaveLength(1)
        expect(receivedContext.skills[0].content).toBe(skill.content)
    })

    test('calls getUserAISkillsFilter with the task user for access vetting', async () => {
        const skill = makeSkill()
        const userId = faker.datatype.uuid()
        AISkill.getAll.mockResolvedValue([skill])

        const task = makeTask({ _userId: userId, _skillIds: [skill.id] })

        await runExecuteAIFlow(task)

        expect(getUserAISkillsFilter).toHaveBeenCalledWith(
            mockKeystoneContext,
            { id: userId },
        )
    })

    test('queries AISkill with id_in and access filter', async () => {
        const skill = makeSkill()
        AISkill.getAll.mockResolvedValue([skill])
        const accessFilter = { isPublic: true, OR: [{ scope: 'global' }] }
        getUserAISkillsFilter.mockResolvedValue(accessFilter)

        const task = makeTask({ _skillIds: [skill.id] })

        await runExecuteAIFlow(task)

        expect(AISkill.getAll).toHaveBeenCalledWith(
            mockSudoContext,
            {
                AND: [
                    { id_in: [skill.id], deletedAt: null },
                    accessFilter,
                ],
            },
            '{ id name description content license compatibility metadata allowedTools }',
        )
    })
})

const { canOnlyServerSideWithoutUserRequest } = require('@open-condo/keystone/access')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/DebtClaimGenerationTask')
const { generateDebtClaims } = require('@condo/domains/billing/tasks')

const { getFileMetaAfterChange } = FileAdapter

const DEBT_CLAIM_GENERATION_TASK_FOLDER = 'DebtClaimGenerationTask'
const DebtClaimTaskFileAdapter = new FileAdapter(DEBT_CLAIM_GENERATION_TASK_FOLDER)
const setFileMetaAfterChange = getFileMetaAfterChange(DebtClaimTaskFileAdapter, 'debtorsFile')

const TASK_STATUS = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
}

const DebtClaimGenerationTask = new GQLListSchema('DebtClaimGenerationTask', {
    schemaDoc: 'Task for generating pre-trial debt claim documents (dosudebki) from a debtors Excel list',
    fields: {

        organization: {
            schemaDoc: 'Organization that owns this task',
            type: 'Relationship',
            ref: 'Organization',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
            access: {
                read: true,
                create: true,
                update: false,
            },
        },

        user: {
            schemaDoc: 'User who triggered the generation',
            type: 'Relationship',
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
            access: {
                read: true,
                create: true,
                update: false,
            },
        },

        status: {
            schemaDoc: 'Current status of the generation task',
            type: 'Select',
            options: Object.values(TASK_STATUS).join(','),
            defaultValue: TASK_STATUS.PROCESSING,
            isRequired: true,
            access: {
                read: true,
                create: canOnlyServerSideWithoutUserRequest,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

        progress: {
            schemaDoc: 'Generation progress, 0-100',
            type: 'Integer',
            isRequired: true,
            defaultValue: 0,
            access: {
                read: true,
                create: canOnlyServerSideWithoutUserRequest,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

        debtorsFile: {
            schemaDoc: 'Input Excel file with debtors list uploaded by the user',
            type: 'File',
            adapter: DebtClaimTaskFileAdapter,
            access: {
                read: true,
                create: true,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

        resultFile: {
            schemaDoc: 'Output ZIP archive with generated DOCX claim documents',
            type: 'File',
            sensitive: true,
            adapter: DebtClaimTaskFileAdapter,
            access: {
                read: true,
                create: canOnlyServerSideWithoutUserRequest,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

        errorFile: {
            schemaDoc: 'Excel file with rows that failed to generate claims',
            type: 'File',
            sensitive: true,
            adapter: DebtClaimTaskFileAdapter,
            access: {
                read: true,
                create: canOnlyServerSideWithoutUserRequest,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

        meta: {
            schemaDoc: 'Generation result metadata: { successCount, failedCount, totalAmount }',
            type: 'Json',
            access: {
                read: true,
                create: canOnlyServerSideWithoutUserRequest,
                update: canOnlyServerSideWithoutUserRequest,
            },
        },

    },
    hooks: {
        afterChange: async (args) => {
            const { updatedItem, operation } = args

            await setFileMetaAfterChange(args)

            if (operation === 'create') {
                await generateDebtClaims.delay(updatedItem.id)
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadDebtClaimGenerationTasks,
        create: access.canManageDebtClaimGenerationTasks,
        update: access.canManageDebtClaimGenerationTasks,
        delete: false,
        auth: true,
    },
})

module.exports = {
    DebtClaimGenerationTask,
    TASK_STATUS,
}

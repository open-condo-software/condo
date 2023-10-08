const dayjs = require('dayjs')
const cloneDeep = require('lodash/cloneDeep')
const get = require('lodash/get')
const isEqual = require('lodash/isEqual')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const {
    BankAccount, BankAccountReportTask, BankAccountReport,
    BankTransaction, BankIntegrationAccountContext,
} = require('@condo/domains/banking/utils/serverSchema')
const { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } = require('@condo/domains/common/constants/tasks')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const { EXPENSES_GROUPED_BY_CATEGORY_AND_COST_ITEM } = require('../constants')

// Avoids producing "BankAccountReportHistoryRecord" record for each iteration in the processing loop, when we update progress
// Practically, we need to
const TASK_PROGRESS_UPDATE_INTERVAL = 10 * 1000 // 10sec

// Rough solution to offload server in case of processing many thousands of records
const SLEEP_TIMEOUT = conf.WORKER_BATCH_OPERATIONS_SLEEP_TIMEOUT || 200

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'generateReports' } }

const logger = getLogger('generateReports')

function sortTransactionsByMonthAndYear (allTransactions) {
    const YearMonthSet = new Set()
    allTransactions.map(({ date }) => YearMonthSet.add(dayjs(date).format('YYYY-MM')))

    const setIterator = YearMonthSet.values()
    const sortedTransactionsByMonthAndYear = []
    for (let i = 0; i <= YearMonthSet.size - 1; i++ ) {
        const currentDate = setIterator.next().value
        const filteredTransactionsByCurrentYearMonth = []
        for (const transaction of allTransactions) {
            if (transaction.date.includes(currentDate)) {
                filteredTransactionsByCurrentYearMonth.push(cloneDeep(transaction))
            }
        }
        sortedTransactionsByMonthAndYear.push(filteredTransactionsByCurrentYearMonth)
    }
    return sortedTransactionsByMonthAndYear
}

function calculateTransactionsTurnover (sortedTransactions) {
    let totalIncome = 0, totalOutcome = 0, date
    const result = []
    for (let transactions of sortedTransactions) {
        date = dayjs(transactions[0].date).format('YYYY-MM')
        for (let transaction of transactions) {
            transaction.isOutcome ? totalOutcome += Number(transaction.amount) : totalIncome += Number(transaction.amount)
        }
        result.push({
            date,
            totalIncome: totalIncome.toString(),
            totalOutcome: totalOutcome.toString(),
        })
        totalIncome = 0
        totalOutcome = 0
    }
    return result
}

async function categoryGroupsBuilder (costItemsDataSortedByDate, { task, lastProgress, context }) {
    const categoryGroups = []
    let firstIter = 0, secondIter = 0
    for (let { date, data } of costItemsDataSortedByDate) {
        firstIter++
        let parsedCategoryData = {}
        for (let costItemId in data) {
            secondIter++
            if (Object.keys(parsedCategoryData).includes(data[costItemId].category.id)) {
                parsedCategoryData[data[costItemId].category.id].costItemGroups.push({
                    id: costItemId,
                    name: data[costItemId].name,
                    isOutcome: data[costItemId].isOutcome,
                    sum: data[costItemId].amount,
                })
            } else {
                parsedCategoryData[data[costItemId].category.id] = {
                    id: data[costItemId].category.id,
                    name: data[costItemId].category.name,
                    costItemGroups: [{
                        id: costItemId,
                        name: data[costItemId].name,
                        isOutcome: data[costItemId].isOutcome,
                        sum: data[costItemId].amount,
                    }],
                }
                await updateTaskProgress({
                    task,
                    lastProgress,
                    context,
                    progress: Math.round((costItemsDataSortedByDate.length / firstIter * 100) / (Object.keys(data).length / secondIter * 100) * 70),
                })
                lastProgress = Date.now()
            }
        }
        categoryGroups.push({
            date,
            data: {
                categoryGroups: Object.values(parsedCategoryData),
            },
        })
    }
    return categoryGroups
}

async function updateTaskProgress ({ task, lastProgress, context, progress }) {
    const taskId = get(task, 'id')
    if (Date.now() - lastProgress > TASK_PROGRESS_UPDATE_INTERVAL) {
        // User can cancel the task at any time, in this all operations should be stopped
        task = await BankAccountReportTask.getOne(context, { id: taskId })
        const taskStatus = get(task, 'status')
        if (!task || taskStatus !== TASK_PROCESSING_STATUS) {
            logger.info({ msg: 'status != processing. Aborting processing reports loop', taskStatus, taskSchemaName: BankAccountReportTask.gql.SINGULAR_FORM, taskId })
            return
        }

        task = await BankAccountReportTask.update(context, taskId, {
            ...DV_SENDER,
            progress,
        })
    }
}
/**
 * Aggregate transactions data and generate report
 * @param taskId
 * @returns {Promise<{categoryGroups: *[] }>}
 */
const generateReports = async (taskId) => {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = await getSchemaCtx('BankSyncTask')
    let task = await BankAccountReportTask.getOne(context, { id: taskId })
    if (!task) {
        throw new Error(`Cannot find BankSyncTask by id="${taskId}"`)
    }

    const { account: { id: bankAccountId }, organization } = task

    const bankAccount = await BankAccount.getOne(context, {
        id: bankAccountId,
        organization: { id: organization.id },
        deletedAt: null,
    })

    const bankIntegrationAccountContext = await BankIntegrationAccountContext.getOne(context, {
        id: bankAccount.integrationContext.id,
    })

    const taskUpdatePayload = {
        ...DV_SENDER,
        progress: 0,
    }
    await BankAccountReportTask.update(context, taskId, taskUpdatePayload)

    const allTransactions = await loadListByChunks({
        context: context,
        list: BankTransaction,
        chunkSize: 50,
        limit: 100000000,
        where: {
            deletedAt: null,
            organization: { id: organization.id },
            account: { id: bankAccount.id },
        },
    })

    for (let transaction of allTransactions) {
        if (!transaction.costItem) {
            const contractorAccountCostItem = get(transaction, 'contractorAccount.costItem')
            if (!contractorAccountCostItem){
                continue
            }
            transaction.costItem = { ...contractorAccountCostItem }
        }
    }

    const sortedTransactions = sortTransactionsByMonthAndYear(allTransactions)
    const monthTurnovers = calculateTransactionsTurnover(sortedTransactions)

    let lastProgress = Date.now()
    let costItemsDataSortedByDate = []
    for (const transactions of sortedTransactions) {
        const costItemData = {
            date: dayjs(transactions[0].date).format('YYYY-MM'),
            data: {},
        }
        for (let i = 0; i < transactions.length; i++) {
            const currentTransaction = transactions[i]
            if (!currentTransaction.costItem) {
                continue
            }
            if (Object.keys(costItemData.data).includes(currentTransaction.costItem.id)) {
                costItemData.data[currentTransaction.costItem.id].amount += Number(currentTransaction.amount)
            } else {
                costItemData.data[currentTransaction.costItem.id] = {
                    amount: Number(currentTransaction.amount),
                    name: currentTransaction.costItem.name,
                    isOutcome: currentTransaction.isOutcome,
                    category: {
                        id: currentTransaction.costItem.category.id,
                        name: currentTransaction.costItem.category.name,
                    },
                }
            }

            await updateTaskProgress({
                task,
                lastProgress,
                context,
                progress: Math.round(allTransactions.length / transactions.length / (i + 1) * 100 * 0.5),
            })
            lastProgress = Date.now()
        }
        costItemsDataSortedByDate.push(costItemData)
    }

    const categoryGroupsSortedByMonth = await categoryGroupsBuilder(
        costItemsDataSortedByDate,
        {
            task,
            lastProgress,
            context,
        })
    lastProgress = Date.now()
    let index = 0
    for (let { date, data } of categoryGroupsSortedByMonth) {
        const reports = await BankAccountReport.getAll(context, {
            period: date,
            deletedAt: null,
            organization: { id: organization.id },
            isLatest: true,
        }, { sortBy: ['createdAt_ASC'] })
        const payload = {
            data,
            version: 1,
            isLatest: true,
            period: date,
            account: { connect: { id: bankAccountId } },
            organization: { connect: { id: organization.id } },
            totalIncome: monthTurnovers[index].totalIncome,
            totalOutcome: monthTurnovers[index].totalOutcome,
            template: EXPENSES_GROUPED_BY_CATEGORY_AND_COST_ITEM,
            amount: get(bankIntegrationAccountContext, 'meta.amount'),
            amountAt: get(bankIntegrationAccountContext, 'meta.amountAt'),
            ...DV_SENDER,
        }
        const lastReport = reports[reports.length - 1]
        if (reports.length > 0) {
            if (!isEqual(
                lastReport.data, data) ||
                Math.round(Number(payload.totalIncome) * 10000) / 10000 !== Math.round(Number(lastReport.totalIncome) * 10000) / 10000 ||
                Math.round(Number(payload.totalOutcome) * 10000) / 10000 !== Math.round(Number(lastReport.totalOutcome) * 10000) / 10000
            ) {
                if (date !== monthTurnovers[index].date) throw new Error('Date from categoryGroups not equal date from monthTurnovers')
                await BankAccountReport.create(context, {
                    ...payload,
                    version: reports[reports.length - 1].version + 1,
                })
                await BankAccountReport.update(context, reports[reports.length - 1].id, { isLatest: false, ...DV_SENDER })
            }
        } else {
            await BankAccountReport.create(context, payload)
        }
        index++
        await updateTaskProgress({
            task,
            lastProgress,
            context,
            progress: Math.round(categoryGroupsSortedByMonth.length / (index + 1) * 100),
        })
        lastProgress = Date.now()
    }

    await BankAccountReportTask.update(context, taskId, {
        ...DV_SENDER,
        progress: 100,
        status: TASK_COMPLETED_STATUS,
    })

    return categoryGroupsSortedByMonth
}

module.exports = {
    generateReportsTask: createTask('generateReportsTask', async (taskId) => {
        await generateReports(taskId)
    }),
}

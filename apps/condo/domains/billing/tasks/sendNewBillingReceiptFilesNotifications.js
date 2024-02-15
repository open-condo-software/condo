const { isNil, get, isEmpty } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { BILLING_RECEIPT_FILE_FOLDER_NAME } = require('@condo/domains/billing/constants/constants')
const { BillingReceiptFile, BillingReceiptAdmin, BillingProperty } = require('@condo/domains/billing/utils/serverSchema')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { BILLING_RECEIPT_FILE_ADDED_TYPE } = require('@condo/domains/notification/constants/constants')
const { EMAIL_FROM } = require('@condo/domains/notification/tasks/sendMessageBatch.helpers')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const fileAdapter = new FileAdapter(BILLING_RECEIPT_FILE_FOLDER_NAME)

async function prepareAttachments (files) {
    return files.filter(file => !isEmpty(get(file, ['sensitiveDataFile', 'publicUrl'])))
        .map(file => {
            const {
                sensitiveDataFile: {
                    filename,
                    publicUrl,
                    mimetype,
                    originalFilename,
                },
            } = file


            const attachment = {
                mimetype,
                originalFilename,
                publicUrl,
            }

            if (fileAdapter.acl && fileAdapter.acl.generateUrl) {
                attachment.publicUrl = fileAdapter.acl.generateUrl({
                    filename: `${fileAdapter.folder}/${filename}`,
                    originalFilename,
                })
            }

            return attachment
        })
}

async function sendNewBillingReceiptFilesNotifications ({ organizationId, organizationName, sender, period, watermark }) {
    const { keystone: context } = getSchemaCtx('BillingReceiptFile')

    // load new billing receipt files
    const billingReceiptFiles = await loadListByChunks({
        context,
        list: BillingReceiptFile,
        where: {
            context: { organization: { id: organizationId } },
            createdAt_gte: watermark,
            deletedAt: null,
        }, sortBy: 'createdAt_ASC',
    })

    /**
     * Proceeding billing receipt files steps:
     * 1. Get related billing receipt
     * 2. Get related organization contact (receipt.account.unitName, receipt.account.unitType, receipt.property.property)
     * 3. Build a dictionary with contact as key and files as a value
     */
    const sendMessagesCache = {}
    for (let billingReceiptFile of billingReceiptFiles) {
        const receipt = await BillingReceiptAdmin.getOne(context, {
            file: { id: billingReceiptFile.id },
            period,
            deletedAt: null,
        })

        // no receipt for billing receipt file
        if (isNil(receipt)) {
            continue
        }

        // destructuring receipt to build contact search conditions 
        const {
            account: { unitName, unitType },
            property: { id: billingPropertyId, addressKey },
        } = receipt
        const billingProperty = await BillingProperty.getOne(context, { id: billingPropertyId })

        // check if no matching property exists
        if (isNil(get(billingProperty, ['property', 'id']))) {
            continue
        }

        // get contacts
        const contacts = await Contact.getAll(context, {
            property: {
                OR: [
                    { addressKey },
                    { id: billingProperty.property.id },
                ],
            },
            email_not: null,
            unitName,
            unitType,
            isVerified: true,
            deletedAt: null,
        })

        // set contacts
        contacts.forEach(contact => {
            if (isNil(sendMessagesCache[contact.email])) {
                sendMessagesCache[contact.email] = {
                    contactId: contact.id,
                    files: [],
                }
            }

            sendMessagesCache[contact.email].files.push(receipt.file)
        })
    }

    // and finally send messages by build cache
    let notificationsSent = 0
    for (let email of Object.keys(sendMessagesCache)) {
        const { files, contactId } = sendMessagesCache[email]
        const pdfExistsFiles = files.filter(file => !isEmpty(get(file, ['sensitiveDataFile', 'publicUrl'])))
        const attachments = await prepareAttachments(pdfExistsFiles)

        // no attachments case
        if (attachments.length === 0) {
            continue
        }

        // generate unique key
        const filesIds = pdfExistsFiles.map(file => file.id).join('_')
        const uniqKey = `new_receipts_files_${contactId}_${filesIds}`

        // send message
        await sendMessage(context, {
            emailFrom: EMAIL_FROM,
            to: { email },
            type: BILLING_RECEIPT_FILE_ADDED_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    organization: organizationName,
                },
                attachments,
            },
            sender,
        })
        notificationsSent++
    }

    return { notificationsSent }
}

module.exports = {
    sendNewBillingReceiptFilesNotifications,
}
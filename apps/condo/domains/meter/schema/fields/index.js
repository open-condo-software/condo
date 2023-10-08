const { Integer, DateTimeUtc, Checkbox, Relationship } = require('@keystonejs/fields')

const { RESIDENT } = require('@condo/domains/user/constants/common')

const numberOfTariffs = {
    type: Integer,
    isRequired: true,
}

const installationDate = {
    schemaDoc: 'Date when the meter was installed',
    type: DateTimeUtc,
}

const commissioningDate = {
    schemaDoc: 'Date when the meter was commissioned.' +
        'Commissioning - documentation of the meter as a billing meter',
    type: DateTimeUtc,
}

const verificationDate = {
    schemaDoc: 'The date when the employee came and checked how accurately the meter counts the resource',
    type: DateTimeUtc,
}

const nextVerificationDate = {
    schemaDoc: 'The date of the next meter verification.' +
        'For example, for a cold water meter - usually 6 years after the verification date',
    type: DateTimeUtc,
}

const controlReadingsDate = {
    schemaDoc: 'The date when the employee came and took readings from the meter',
    type: DateTimeUtc,
}

const sealingDate = {
    schemaDoc: 'The date when meter was sealed.' +
        'Sealing is the installation of a unique single-use device (directly a seal and a sealing rope)' +
        'on the metering device, which is designed to control unauthorized access to the equipment.',
    type: DateTimeUtc,
}

const isAutomatic = {
    schemaDoc: 'Determines, if Meter is automatic or not. False by default. ' +
        `If set to True - prevents user with type "${RESIDENT}" from creating MeterReading.` +
        'So MeterReadings only be acquired through external integration or adjusted by organization employee',
    type: Checkbox,
    isRequired: true,
    defaultValue: false,
}

const resource = {
    schemaDoc: 'Meter resource, such as hot water or electricity',
    type: Relationship,
    ref: 'MeterResource',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const b2bApp = {
    schemaDoc: 'Ref to B2BApp, which is used as a master system for this meter. Specified organization must connect this app.',
    type: Relationship,
    ref: 'B2BApp',
    isRequired: false,
    knexOptions: { isNotNullable: false }, // Relationship only!
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

module.exports = {
    numberOfTariffs,
    b2bApp,
    resource,
    isAutomatic,
    sealingDate,
    controlReadingsDate,
    nextVerificationDate,
    verificationDate,
    commissioningDate,
    installationDate,
}
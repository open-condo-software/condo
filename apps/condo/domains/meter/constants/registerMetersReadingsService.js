const READINGS_LIMIT = 500

const DATE_FIELD_PATHS = [
    { path: 'date', nullable: false },
    { path: 'meterMeta.verificationDate', nullable: true },
    { path: 'meterMeta.nextVerificationDate', nullable: true },
    { path: 'meterMeta.installationDate', nullable: true },
    { path: 'meterMeta.commissioningDate', nullable: true },
    { path: 'meterMeta.sealingDate', nullable: true },
    { path: 'meterMeta.controlReadingsDate', nullable: true },
    { path: 'meterMeta.archiveDate', nullable: true },
]

const DATE_FIELD_PATH_TO_TRANSLATION = {
    'date': 'meter.import.column.meterReadingSubmissionDate',
    'meterMeta.verificationDate': 'meter.import.column.VerificationDate',
    'meterMeta.nextVerificationDate': 'meter.import.column.NextVerificationDate',
    'meterMeta.installationDate': 'meter.import.column.NextVerificationDate',
    'meterMeta.commissioningDate': 'meter.import.column.CommissioningDate',
    'meterMeta.sealingDate': 'meter.import.column.SealingDate',
    'meterMeta.controlReadingsDate': 'meter.import.column.ControlReadingsDate',
    'meterMeta.archiveDate': 'meter.import.column.ArchiveDate',
}

module.exports = {
    READINGS_LIMIT,
    DATE_FIELD_PATHS,
    DATE_FIELD_PATH_TO_TRANSLATION,
}
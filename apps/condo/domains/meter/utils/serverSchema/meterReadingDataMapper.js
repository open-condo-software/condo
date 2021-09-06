const meterReadingDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Дата снятия', 'Адрес', 'Услуга', 'Номер прибора', 'Место', 'Показание', 'Житель', 'Источник'],
        en: ['Reading date', 'Address', 'Service', 'Meter number', 'Place', 'Reading', 'Contact', 'Source'],
    },
    rows: {
        date: () => constants.date,
        address: () => row.property.address,
        resource: () => row.meter.resource.name,
        number: () => row.meter.number,
        place: () => row.meter.place,
        value1: () => row.value1,
        clientName: () => row.clientName,
        source: () => row.source.name,
    },
})

module.exports = meterReadingDataMapper

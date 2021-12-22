const meterReadingDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Дата снятия', 'Адрес', 'Квартира', 'Лицевой счет', 'Услуга', 'Номер прибора', 'Место', 'Показание по тарифу №1', 'Показание по тарифу №2',
            'Показание по тарифу №3', 'Показание по тарифу №4', 'Житель', 'Источник'],
        en: ['Reading date', 'Address', 'Unit', 'Account number', 'Service', 'Meter number', 'Place', 'Reading from tariff №1', 'Reading from tariff №2',
            'Reading from tariff №3', 'Reading from tariff №4', 'Contact', 'Source'],
    },
    rows: {
        date: () => row.date,
        address: () => row.meter.property.address,
        unitName: () => row.meter.unitName,
        accountNumber: () => row.meter.accountNumber,
        resource: () => row.meter.resource.name,
        number: () => row.meter.number,
        place: () => row.meter.place,
        value1: () => row.value1,
        value2: () => row.value2,
        value3: () => row.value3,
        value4: () => row.value4,
        clientName: () => row.clientName,
        source: () => row.source.name,
    },
})

module.exports = meterReadingDataMapper

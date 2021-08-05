module.exports = [
    {
        listKey: 'User',
        items: [
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    name: 'Admin',
                    email: 'admin@example.com',
                    phone: '+79068888888',
                    password: '3a74b3f07978',
                    isAdmin: true,
                },
            },
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    name: 'JustUser',
                    email: 'user@example.com',
                    phone: '+79067777777',
                    password: '1a92b3a07c78',
                    isAdmin: false,
                },
            },
        ],
    },
    {
        listKey: 'BillingIntegration',
        items: [
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    name: 'очень длинное имя интеграции аываываыва',
                    shortDescription: 'Short integration description, that would be shown on settings card',
                    detailsTitle: 'подключение картошки',
                    detailsText: 'asdasdasdasdkasldkals;kdlaskdl;asd;lals;d;kasl;dkalsdk;asd;as',
                    detailsInstructionButtonText: 'Инструкция',
                    detailsInstructionButtonLink: 'https://www.ivi.ru/collections/movies-taxi',
                },
            },
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    name: 'Такси',
                    shortDescription: 'Short integration description, that would be shown on settings card',
                    detailsTitle: 'подключение картошки',
                },
            },
        ],
    },
]

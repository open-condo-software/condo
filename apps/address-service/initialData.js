module.exports = [
    {
        listKey: 'User',
        items: [
            {
                data: {
                    name: 'Local admin',
                    email: 'admin@example.com',
                    isAdmin: true,
                    isSupport: true,
                    password: '3a74b3f07978',
                    dv: 1,
                    sender: {
                        dv: 1,
                        fingerprint: 'initial-data',
                    },
                },
            },
            {
                data: {
                    name: 'Local User',
                    email: 'user@example.com',
                    isAdmin: false,
                    isSupport: false,
                    password: '1a92b3a07c78',
                    dv: 1,
                    sender: {
                        dv: 1,
                        fingerprint: 'initial-data',
                    },
                },
            },
        ],
    },
]

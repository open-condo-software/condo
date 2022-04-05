module.exports = [
    {
        listKey: 'User',
        items: [
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    v: 1,
                    name: 'MiniAdmin',
                    email: 'admin@example.com',
                    password: '3a74b3f07978',
                    isAdmin: true,
                    isLocal: true,
                },
            },
            {
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'initial' },
                    v: 1,
                    name: 'MiniJustUser',
                    email: 'user@example.com',
                    password: '1a92b3a07c78',
                    isAdmin: false,
                    isLocal: true,
                },
            },
        ],
    },
]

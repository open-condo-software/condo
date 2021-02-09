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
                    dob: '1990-01-02',
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
                    dob: '1995-06-09',
                    password: '1a92b3a07c78',
                    isAdmin: false,
                },
            },
        ],
    },
]

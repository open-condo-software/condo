module.exports = [
    {
        listKey: 'User',
        items: [
            {
                data: {
                    name: 'Admin',
                    email: 'admin@example.com',
                    isEmailVerified: false,
                    isAdmin: true,
                    dob: '1990-01-02',
                    // this is development only data
                    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
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
                    name: 'JustUser',
                    email: 'user@example.com',
                    isEmailVerified: false,
                    isAdmin: false,
                    dob: '1995-06-09',
                    // this is development only data
                    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
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

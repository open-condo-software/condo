async function getOrganizationInfo (tin) {
    if (!tin || tin === '00000000') {
        return { error: true }
    }

    return {
        result: {
            name: `Company ${tin}`,
            timezone: 'Asia/Yakutsk',
            territoryCode: tin,
            iec: tin,
            tin,
            psrn: tin,
            country: 'en',
        },
    }
}

async function getBankInfo (routingNumber) {
    if (!routingNumber || routingNumber === '00000000') {
        return { error: true }
    }

    return {
        result: {
            routingNumber,
            bankName: `Bank for ${routingNumber}`,
            offsettingAccount: routingNumber,
            territoryCode: routingNumber,
        },
    }
}

module.exports = {
    getOrganizationInfo,
    getBankInfo,
}

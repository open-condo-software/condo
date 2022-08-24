const {
    CondoBicryptSign,
} = require('../lib/binding')


const textToSign =  `
<?xml version="1.0" encoding="UTF-8"?>
<order>
   <action>group_list</action>
   <agent>A9038/01</agent>
   <terminal>903810V</terminal>
   <pay_type>ПЛАСТ_СПИС</pay_type>
   <version_protocol>1.3.7</version_protocol>
</order>
`


const demoKeys = [
    ['A005LP01', '3m2zpx'],
    ['A005LP02', 'aAKw5a'],
    ['A004DT04', 'bWDu3V'],
]

async function testSign () {
    console.time('signatureCreate')
    const [keyName, passPhrase] = demoKeys[2]
    const instance = new CondoBicryptSign({ keyName, passPhrase })

    const { xml, signature } = await instance.sign(textToSign, true)
    console.timeEnd('signatureCreate')
    return {
        toSign: textToSign,
        xml,
        signature,
    }
}

testSign().then(result => {
    console.log('All Done!', result)
    process.exit(0)
}).catch(error => {
    process.exit(1)
})

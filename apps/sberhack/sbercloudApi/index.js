const SbercloudFGS = require("./sbercloud.fgs.api")

SbercloudFGS.listAllFunctions().then(x => console.log(x))
SbercloudFGS.createFunctionGraph('test-from-api-02', 'A function created by Nodejs api!', 'Node10', `exports.handler = async (event, context) => {
    const output =
    {
        'statusCode': 200,
        'headers':
        {
            'Content-Type': 'application/json'
        },
        'isBase64Encoded': false,
        'body': JSON.stringify(event),
    }
    return output;
}
`).then(r => console.log(r))

const Upload = require('graphql-upload/Upload.js')

const u = new Upload()
const file = {
    asd: 'asdasdasd',
}

u.resolve(file)

console.log(u)
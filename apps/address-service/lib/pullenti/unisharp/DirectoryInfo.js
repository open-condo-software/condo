const fs = require('fs');
const path = require('path');

class DirectoryInfo {
    constructor(fname) {
        this.fullname = path.resolve(fname);
        this.dirname = path.dirname(this.fullname);
        this.name = path.basename(this.fullname);
    }
    exists() {
        try {
            return fs.existsSync(this.fullname) && fs.statSync(this.fullname).isDirectory();
        }
        catch(e) 
        {
            return false;
        }
    }
    delete() {
        fs.unlinkSync(this.fullname);
    }

}
module.exports = FileInfo
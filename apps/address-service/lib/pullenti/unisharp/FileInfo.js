const fs = require('fs');
const path = require('path');

class FileInfo {
    constructor(fname) {
        this.fullname = path.resolve(fname);
        this.dirname = path.dirname(this.fullname);
        this.name = path.basename(this.fullname);
        this.length = -1;
        try {
           if(fs.existsSync(this.fullname) && fs.statSync(this.fullname).isFile())
                this.length = fs.statSync(this.fullname).size;
        }
        catch(e) {}
    }
    exists() {
        try {
            return fs.existsSync(this.fullname) && fs.statSync(this.fullname).isFile();
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
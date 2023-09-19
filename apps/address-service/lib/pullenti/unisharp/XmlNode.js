class XmlNode {
    
    constructor() {
        this.local_name = null;
        this.name = null;
        this.value = null;
        this.parent_node = null;
        this.child_nodes = new Array();
        this.attributes = new Array();
    }
    
    get inner_text() {
        return this.value;
    }
}


module.exports = XmlNode

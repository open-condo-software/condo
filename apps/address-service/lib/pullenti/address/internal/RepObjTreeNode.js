/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


class RepObjTreeNode {
    
    constructor() {
        this.objs = null;
        this.lazyPos = 0;
        this.loaded = false;
        this.children = null;
    }
    
    unload() {
        if (this.lazyPos === 0) 
            return;
        if (this.children !== null) 
            this.children.clear();
        this.children = null;
        if (this.objs !== null) 
            this.objs.clear();
        this.objs = null;
        this.loaded = false;
    }
}


module.exports = RepObjTreeNode
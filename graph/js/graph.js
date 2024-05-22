class Graph {
    static id = 0;
    /**@type {Map<number,Graph>} */
    static graphMap = new Map();
    /**@type {Graph} */
    static selected;
    static get(id) { return this.graphMap.get(id); }
    static ORDERED = 1;
    static UNORDERED = 0;

    constructor(type, template="default", data) {
        /**@type {Tab}*/
        this.tab;
        /** @type {HTMLElement}*/
        this.header;
        
        Graph.graphMap.set(this.id = ++Graph.id, this);

        this.type = type;
        this.selection = new GraphSelection(this.id);
        this.actionsStack = new CommandStack(this);
        this.edgeCount = 0;
        
        this.settings = this.initSettings();
        UI.createTabUI(this);
        GraphTemplate.get(template).load(this, data);
        

        /**@type {Map<number,Set<number>>} */
        this.nodes = new Map();
        this.a_nodeId = 1;
    }
    setStyleAttribute(attribute,value) {
        return this.tab.tab.style.setProperty(attribute, value);
    }
    initSettings() {
        return new Proxy({}, {
            set: (object, prop, newValue) => {
                object[prop] = newValue;
                switch (prop) {
                    case "name": UI.headerList.update(UI.headerList.list.indexOf(this.id)); break;
                    case "main_color": case "secondary_color": {
                        object[prop] = standardize_color(newValue);
                        if (prop == "main_color") this.setStyleAttribute("--main-color", newValue);
                        if (prop == "secondary_color") this.setStyleAttribute("--secondary-color", newValue);

                        this.header.style.background = `linear-gradient(45deg,${this.settings.main_color},${this.settings.secondary_color})`;
                        UI.setHeaderAreaColor(this.settings.main_color, this.settings.secondary_color);
                        break;
                    }
                    case "zoom": {
                        this.tab.style.setProperty("zoom", newValue);
                        this.tab.zoom = newValue;
                        if (Graph.selected == this) UI.viewMenu.querySelector("[name='zoom']").set(newValue);
                        break;
                    }
                    case "template": this.tab.template = newValue; break;
                    case "show_ruler": this.tab.toggleRuler?.(newValue); break;
                }
                return true;
            }
        })
    }

    focus() {
        if (Graph.selected === this) return;
        Graph.selected = this;
        this.tab.focus();
        UI.setHeaderAreaColor(Graph.selected.settings.main_color, Graph.selected.settings.secondary_color);
        UI.tabArea.selectTab(this.id);

        inspector.observe(this.tab);
        UI.viewMenu.load(this.settings);
    }
    nextAvailableID() {
        while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
        return this.a_nodeId;
    }
    /**@returns {NodeUI} */
    addNode(options = {}, addToStack = true) {
        options.nodeId ||= this.nextAvailableID();
        options.graphId ||= this.id;
        options.description ||= options.nodeId;

        this.nodes.set(options.nodeId, new Set());
        let newNode = this.tab.addNode(options);

        if (addToStack) this.actionsStack.push(new AddNodesCommand(newNode.toJSON()));
        return newNode;
    }
    removeNode(id, addToStack = true) {
        let n = this.getNodeUI(id);
        if (!n) return;

        this.actionsStack.startGroup();
        if (addToStack) this.actionsStack.push(new RemoveNodesCommand(n.toJSON()));
        for (let n1 of this.adjacentNodes(id)) {
            if (n1 < 0) {
                this.removeEdge(-n1, id, addToStack);
            }
            else {
                this.removeEdge(id, n1, addToStack);
                if (this.type == Graph.ORDERED && this.isEdge(n1, id)) {
                    this.removeEdge(n1, id, addToStack);
                }
            }
        }
        this.actionsStack.endGroup();

        Tab.sizeObserver.unobserve(n);
        this.tab.removeChild(n);
        if (n.selected) this.selection.toggle(n);

        if (physicsMode.isRunning()) {
            physicsMode.stop();
            ACTIONS.togglePhysicsSimulation();
        }

        let rez = this.nodes.delete(id);
        if (rez && id < this.a_nodeId) this.a_nodeId = id;
        return rez;
    }
    /**@returns {EdgeUI} */
    addEdge(props={}, addToStack = true) {

        let x = props.from, y = props.to;
        if ((x == y) || this.isEdge(x, y)) return;
        
        props.graphId = this.id;

        let reverse = false;
        let xSet = this.adjacentNodes(x);
        let ySet = this.adjacentNodes(y);

        if (!xSet || !ySet) return;
        switch (this.type) {
            case Graph.ORDERED: {
                if (xSet.has(-y)) {
                    xSet.delete(-y);
                    reverse = true;
                } else ySet.add(-x);
                xSet.add(y);
                break;
            } case Graph.UNORDERED: {
                xSet.add(y);
                ySet.add(x)
                if (x > y) [props.from, props.to] = [props.to, props.from];
                break;
            }
        }
        let newEdge = this.tab.addEdge(props, this.type ,reverse);

        if (addToStack) this.actionsStack.push(new AddEdgesCommand(newEdge.toJSON()));
        this.edgeCount++;


        return newEdge;

    }
    removeEdge(x, y, addToStack = true) {
        let xSet = this.adjacentNodes(x);
        let ySet = this.adjacentNodes(y);
        let rez = xSet?.delete(y);
        if (rez) {
            let e = this.getEdgeUI(x, y);

            if (e.selected) this.selection.toggle(e);
            this.tab.removeChild(e);

            if (this.type == Graph.UNORDERED) ySet.delete(x);
            else {
                //1-2
                //2-1
                rez = ySet.delete(-x);
                if (!rez) {
                    xSet.add(-y);
                    let e2 = this.getEdgeUI(y, x);
                    e2.offset = 0;
                    e2.update();
                }
            }

            if (addToStack) this.actionsStack.push(new RemoveEdgesCommand(e.toJSON()));
            this.edgeCount--;
        }
        return rez;
    }
    isEdge(x, y) {
        return this.adjacentNodes(x)?.has(y);
    }
    getNodeUI(id) {
        return this.tab.getNode(id);
    }
    getEdgeUI(n1, n2) {
        return this.tab.getEdge(n1, n2, this.type);
    }
    adjacentNodes(id) {
        return this.nodes.get(id);
    }

    delete() {
        let newId = UI.headerList.list.find((id) => id != this.id);
        if (newId) Graph.get(newId).focus();

        if (physicsMode?.isRunning()) physicsMode.stop();

        this.tab.delete();
        this.header.remove();
        let index = UI.headerList.list.indexOf(this.id);
        UI.headerList.list.splice(index, 1);

        Graph.graphMap.delete(this.id);
        this.actionsStack.clear();
        this.actionsStack.graph = undefined;
        delete this;
    }

    toJSON() {
        let obj = {
            template: this.template,
            data: this.settings,
            type: this.type,
            nodeProps: [],
            edgeProps: []
        };

        for (const child of this.tab.children) {
            if (child.matches("graph-node")) obj.nodeProps.push(child.toJSON());
            else if (child.matches("graph-edge")) obj.edgeProps.push(child.toJSON());
        }
        return obj;
    }

    static parse(obj = defaultGraphJSON) {
        let newG = new Graph(obj.type, obj.template, obj.data);
        setTimeout(() => {
            newG.actionsStack.startGroup();
            for (let node of obj.nodeProps) newG.addNode(node);
            for (let edge of obj.edgeProps) newG.addEdge(edge);
            newG.actionsStack.endGroup();
            
        }, 100);

        return newG;
    }
    get maxId() {
        let max = -1e9;
        for (let [k, v] of this.nodes) if (k > max) max = k;
        return max;
    }

    get nodeCount() { return this.nodes.size }

    getDegree(id,inOut) {
        if (this.type == Graph.UNORDERED) return this.adjacentNodes(id).size;
        let array = Array.from(this.adjacentNodes(id)), inner = 0, outer = 0;

        for (let n of array) n < 0 ? inner++ : outer++;
        if (inOut === true) return inner;
        else if (inOut === false) return outer;
        else return { inner, outer };
    }

    toMatrix(toString = false) {
        let mId = this.maxId;
        let matrix = createMatrix(mId + 1, mId + 1);
        for (let [k, v] of this.nodes) {
            for (let n of v) {
                if (n > 0) matrix[k][n] = 1;
            }
        }
        if (toString) {
            return matrix.map(el => el.join(', ')).join("\n");
        }
        return matrix;
    }

    toAdjacencyList(toString = false) {
        let map = new Map();
        if (this.type == Graph.ORDERED) {
            let Filter = (el) => el > 0;
            for (let [k, v] of this.nodes) map.set(k, Array.from(v).filter(Filter));
        } else {
            for (let [k, v] of this.nodes) if (v.size) map.set(k, Array.from(v));
        }

        if (toString) {
            let rez = '';
            for (let [k, v] of map) if (v.length) rez += k + " : " + v.join(" ") + "\n";
            return rez;
        }
        return map;
    }

    toEdgeList(toString = false) {
        let matrix = this.toMatrix(), n = matrix.length - 1;
        let array = [];

        if (this.type == Graph.ORDERED) {
            for (let i = 1; i <= n; i++)
                for (let j = 1; j <= n; j++)if (matrix[i][j]) array.push([i, j]);
        } else {
            for (let i = 1; i <= n; i++)
                for (let j = i; j <= n; j++)if (matrix[i][j]) array.push([i, j]);
        }
        if (toString) return array.map((el) => el.join(" ")).join("\n");
        return array;
    }

    isTree() {
        return this.edgeCount == this.nodeCount - 1;
    }

    getPath(from, to, type="Path") {
        
        if (!from || !this.nodes.has(from)) return [];
        let newList = [], dfs=new Dfs(this);

        if (!to) {
            dfs.conditions.push((node, handler) => {
                newList.push(Array.from(handler.stack));
                return true;
            })
        } else {
            if (from == to) {
                dfs.conditions = [(node, handler) => {
                    if (node < 0) return false;
                    if (node == from && handler.stack.length > 2) {
                        newList.push(Array.from(handler.stack));
                        newList.at(-1).push(to);
                        return false;
                    }
                    return !handler.frMap.has(node);
                }] 
            } else {
                dfs.conditions.push((node, handler) => {
                    if (node != to) return true;
                    newList.push(Array.from(handler.stack));
                    newList.at(-1).push(to);
                    return false;
                })
            }
        }
        dfs.reset();
        dfs.start(from);
        return newList;
    }
    //To do
    parentArray(anchor) {
        if (!this.isTree()) return;
        let array = new Array(this.maxId + 1).fill(-1);

        return array;
    }

    conexParts() {
        let visitedStack = [], cnt = 0;
        let rez = {
            array: [],
            map: new Map()
        } 
        let pushSol = (node, index) => {
            if (!rez.array[index]) rez.array.push([]);
            rez.array[index].push(node);
            rez.map.set(node, index);
        }

        if (this.type === Graph.UNORDERED) {
            let dfs1 = (node, index) => {
                pushSol(node, index);
                for (let n of this.adjacentNodes(node)) if (n > 0 && !rez.map.has(n)) dfs1(n, index);
            }
            for (let [k, _] of this.nodes) if (!rez.map.has(k)) dfs1(k, cnt++);
            return rez;
        }

        let dfs1 = (node) => {
            rez.map.set(node, 1);
            for (let n of this.adjacentNodes(node)) if (n > 0 && !rez.map.has(n)) dfs1(n);
            visitedStack.push(node);
        }
        let dfs2 = (node,index) => {
            pushSol(node, index);
            for (let n of this.adjacentNodes(node)) {
                if (n < 0) {
                    if (rez.map.has(-n)) continue;
                    n = -n;
                } else if (rez.map.has(n) || !this.isEdge(n, node)) continue;
                dfs2(n, index);
            }
        }
        
        for (let [k, _] of this.nodes) if (!rez.map.has(k)) dfs1(k);
        rez.map.clear();

        for (let i = visitedStack.length - 1; i >= 0; i--){
            if (rez.map.has(visitedStack[i])) continue;
            //pushSol(visitedStack[i], cnt);
            dfs2(visitedStack[i], cnt++);
        }
        return rez;
    }

}

class Dfs{
    /**@param {Graph} graph */
    constructor(graph) {
        this.frMap = new Map();
        this.conditions = [(node, handler) => node > 0 && !handler.frMap.has(node)];
        this.onreturn=[]
        this.onvisit = [(node, handler) => {
            this.stack.push(node);
            this.frMap.set(node, 1);
        }];
        this.graph = graph;
        this.stack = [];
    }
    validate(node) {
        return this.conditions.every(item => item(node, this));
    }
    visit(node) {
        for (const f of this.onvisit) f(node, this);
    }
    return(node) {
        for (const f of this.onreturn) f(node);
        this.stack.pop();
        this.frMap.delete(node)

    }
    lastVisited(stepsBack=1){
        return this.stack.at(-stepsBack);
    }
    reset() {
        this.frMap.clear();
        this.stack = [];
    }

    start(node) {
        this.visit(node);
        for (const child of this.graph.adjacentNodes(node) || []) {
            if (this.validate(child)) {
                this.start(child);
                this.return(child);
            }
        }
        this.onChildrenVisited?.(node);
    }
}

class GraphTemplate{
    /**@type {Map<string,GraphTemplate>} */
    static map = new Map();
    static get(name) { return GraphTemplate.map.get(name) }
    static styleSheet = (() => {
        let a = new CSSStyleSheet();
        a.replaceSync(defaultTemplateStyls.graph);
        return a;
    })();

    constructor(name, styles, data) {
        this.id = GraphTemplate.styleSheet.insertRule(`graph-tab[template=${name}]{${styles}}`);
        this.name = name;
        this.data = {
            name: "",
            main_color: "",
            secondary_color: "",
            show_ruler: "true",
            zoom: 1,
            nodeTemplate: "default",
            edgeTemplate: "default",
            background: ""
        }
        
        mergeDeep(this.data, data);

        GraphTemplate.map.set(name, this);
    }
    load(graph, data) {
        graph.template = this.name;
        if (!data && this.name == "default") {
            this.data.name = "Graph " + graph.id;
            this.data.main_color = UI.colors[UI.colorIndex++];
            this.data.secondary_color = UI.colors[UI.colorIndex];
            if (UI.colorIndex >= UI.colors.length) UI.colorIndex = 1;

            graph.tab.style.cssText += `--main-color: ${this.data.main_color}; --secondary-color: ${this.data.secondary_color}`;
        }
        graph.tab.template = this.name;
        mergeDeep(graph.settings, { ...this.data, ...data });
    }
    set cssRule(data) {
        this.id = GraphTemplate.styleSheet.insertRule(data);
    }

    get cssRule() {
        return NodeTemplate.styleSheet.cssRules[this.id];
    }

    toJSON() {
        return {...this.data,css: this.cssRule.cssText};
    }
}
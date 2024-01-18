const ORDERED = 1;
const UNORDERED = 0;

class Graph {
    
    static id = 0;
    static graphMap = new Map();
    /**@type {Graph} */
    static selected;
    static get(id) { return this.graphMap.get(id); }

    constructor(type, settings = defaultGraphJSON.settings) {
        /**@type {Tab}*/
        this.tab;
        /** @type {HTMLElement}*/
        this.header;
        
        this.id = ++Graph.id;
        this.type = type;
        this.selection = new GraphSelection(this.id);
        this.settings = JSON.parse(JSON.stringify(settings));
        this.actionsStack = new CommandStack(this);
        this.edgeCount = 0;

        createTabUI(this);
        Graph.graphMap.set(this.id, this);

        /**@type {Map<number,Set<number>>} */
        this.nodes = new Map();
        this.a_nodeId = 1;
        this.loadSettings();
    }
    loadSettings() {
        
        for (let c in this.settings) {
            let chain = ["",c], props = this.settings[c];
            for (let i in props) {
                chain[0] = i;
                this.setSettings(chain, props[i]);
            }
        }
    }

    setSettings(chain, value) {
        if (this === Graph.selected) greatMenus.viewMenu.set(chain, value);
        CustomInputs.getFromChain(this.settings, chain, 1)[chain[0]] = value;

        let template = CustomInputs.getFromChain(defaultSettingsTemplate, chain);
       
        if (template) {
            template._update?.(this);
            if (template._property) this.tab.style.setProperty(template._property, value + (template._unit || ""));
        }
        return value; 
    }

    unfocus() {
        this.header?.classList.remove("selected");
        this.tab?.classList.add("hide");
        if (physicsMode.isRunning()) physicsMode.stop();
    }
    focus() {
        if (Graph.selected === this) return;
        Graph.selected?.unfocus();
        Graph.selected = this;

        this.header.classList.add("selected");
        defaultSettingsTemplate.graph.main_color._update(this);
        this.tab.classList.remove("hide");
        this.tab.focus();

        greatMenus.viewMenu.querySelector(".category").load(this.settings);
    }
    addNode(newId, addToStack=true) {
        if (newId === undefined) {
            while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
            newId = this.a_nodeId;
        }
        this.nodes.set(newId, new Set());
        if (addToStack) this.actionsStack.push(new AddNodesCommand(newId));
        return this.tab.addNode({ id: newId });
    }
    removeNode(id, addToStack=true) {
        let n = this.getNodeUI(id);
        if (!n) return;

        this.tab.sizeObserver.unobserve(n);
        this.tab.removeChild(n);
        if (n.selected) this.selection.toggle(n);

        this.actionsStack.startGroup();
        if (addToStack) this.actionsStack.push(new RemoveNodesCommand(id));
        for (let n1 of this.adjacentNodes(id)) {
            if (n1 < 0) {
                this.removeEdge(-n1, id,addToStack);
            }
            else {
                this.removeEdge(id, n1,addToStack);
                if (this.type == ORDERED && this.isEdge(n1, id)) {
                    this.removeEdge(n1, id,addToStack);
                }
            }
        }
        this.actionsStack.endGroup();

        if (physicsMode.isRunning()) {
            physicsMode.stop();
            ACTIONS.togglePhysicsSimulation();
        }

        let rez = this.nodes.delete(id);
        if (rez && id < this.a_nodeId) this.a_nodeId = id;
        return rez;
    }
    addEdge(x, y, addToStack=true) {
        if ((x == y) || this.isEdge(x, y)) return;

        let reverse = false;
        let xSet = this.adjacentNodes(x);
        let ySet = this.adjacentNodes(y);

        switch (this.type) {
            case ORDERED: {
                if (xSet.has(-y)) {
                    xSet.delete(-y);
                    reverse = true;
                } else ySet.add(-x);
                xSet.add(y);
                break;
            } case UNORDERED: {
                xSet.add(y);
                ySet.add(x)
                if (x > y) [x, y] = [y, x];
            }
        }
        if(addToStack)this.actionsStack.push(new AddEdgesCommand([x, y]));
        this.edgeCount++;
        let offset = this.settings.edge.cp_offset;
        return this.tab.addEdge({
            from: x,
            to: y,
            type: this.type,
            cp_offset: new Point(offset[0], offset[1]),
            cp_symmetry: this.settings.edge.cp_symmetry,
            mode: this.settings.edge.mode,
            reverse
        })

    }
    removeEdge(x, y,addToStack=true) {
        let rez = this.nodes.get(x)?.delete(y);
        if (rez) {
            let e = this.tab.getEdge(x, y);
            this.tab.removeChild(e);

            if (e.selected) this.selection.toggle(e);
            if (this.type == UNORDERED) this.nodes.get(y).delete(x);
            else this.nodes.get(y)?.delete(-x);

            if(addToStack)this.actionsStack.push(new RemoveEdgesCommand([x, y]));
            this.edgeCount--;
        }
        return rez;
    }
    isEdge(x, y) {
        return this.adjacentNodes(x)?.has(y) > 0;
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
        let adjacentHeader = this.header.previousElementSibling || this.header.nextElementSibling;
        if (adjacentHeader.matches("button span")) graphs.get(parseInt(adjacentHeader.id.slice(1))).focus();
        if (physicsMode?.isRunning()) physicsMode.stop();

        this.tab.delete();
        this.header.remove();
        graphs.delete(this.id);
        this.actionsStack.clear();
        this.actionsStack.graph = undefined;
        delete this;
    }

    dataTemplate() {
        let obj = {
            settings: this.settings,
            type: this.type,
            data: {
                nodes: [],
                connections: {},
                nodeProps: {},
                edgeProps: {}
            }
        };
        for (let [n,neighbours] of this.nodes) {
            obj.data.nodes.push(parseInt(n));
            let node = this.getNodeUI(n);
            obj.data.nodeProps[n] = {
                position: [node.transform.position.x, node.transform.position.y]
            };
            obj.data.connections[n] = Array.from(neighbours).filter((el) => el > 0);
        }
        
        return obj;
    }

    static parse(obj = defaultGraphJSON) {
        console.log(obj);
        if (!obj || typeof obj !== "object" || !obj.settings || obj.type===undefined || !obj.data.nodes || !obj.data.connections) return;
        let newG = new Graph(obj.type, obj.settings);

        for (let i of obj.data.nodes) {
            let n = newG.addNode(i);
            let props = obj.data.nodeProps[i];
            if (props) {
                if (props.position) n.position(props.position[0], props.position[1]);
            }
        }
        for (let node in obj.data.connections) {

            let adjacent = obj.data.connections[node], i = parseInt(node);
            for (let j of adjacent) newG.addEdge(i, j);
        }

        return newG;
    }
    get maxId() {
        let max = -1e9;
        for (let [k, v] of this.nodes) if (k > max) max = k;
        return max;
    }

    get nodeCount() { return this.nodes.size }

    toMatrix(toString=false) {
        let mId = this.maxId;
        let matrix = createMatrix(mId+1, mId+1);
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
        if (this.type == ORDERED) {
            let Filter = (el) => el > 0;
            for (let [k, v] of this.nodes) map.set(k,Array.from(v).filter(Filter));
        } else {
            for (let [k, v] of this.nodes)if(v.size) map.set(k, Array.from(v));
        }
       
        if (toString) {
            let rez = '';
            for (let [k, v] of map)if(v.length) rez += k + " : " + v.join(" ") + "\n";
            return rez;
        }
        return map;
    }

    toEdgeList(toString=false) {
        let matrix = this.toMatrix(), n = matrix.length - 1;
        let array = [];

        if (this.type == ORDERED) {
            for (let i = 1; i <= n; i++)
                for (let j = 1; j <= n; j++)if (matrix[i][j]) array.push([i,j]);
        } else {
            for (let i = 1; i <= n; i++)
                for (let j = i; j <= n; j++)if (matrix[i][j]) array.push([i,j]);
        }   
        if (toString) return array.map((el) => el.join(" ")).join("\n");
        return array;
    }

    isTree() {
        return this.edgeCount == this.nodeCount - 1;
    }

    dfs(origin, callback=(from,to,sol,fr)=>true, condition=(from,to,sol,fr)=>true) {
        let fr = new Array(this.maxId+1).fill(0);
        let sol = [origin];

        callback(0, origin, sol, fr);
        let f = (origin) => {
            if (fr[origin]) return;
            fr[origin]++;
            
            for (let n of this.adjacentNodes(origin)) {
                if (!condition()) continue;
                if (n < 0 || fr[n]) continue;
                sol.push(n);
                callback(origin, n, sol, fr);
                f(n);
            }
        }
        f(origin);
        return sol;
    }

    parentArray(anchor) {
        if (!this.isTree()) return;
        let array = new Array(this.maxId+1).fill(-1);
        
        this.dfs(anchor, (from, to) => array[to] = from);
        return array;
    }

    conexParts() {
        let fr = new Array(this.maxId + 1).fill(0), cnt = 0, rez = [];
        if (this.type == UNORDERED) {
            let call = (from, to, sol, frec) => fr[to] = cnt;
            let condition = (from, to, sol, frec) => fr[to] != 0;
            
            for (let [k, _] of this.nodes) {
                if (fr[k]) continue;
                cnt++;
                rez.push(this.dfs(k, call, condition).sort());
            }
            return {
                list: rez,
                map: fr,
            };
        } 

        let stack = [], current=[];
        let dfs1 = (node) => {
            fr[node]++;
            for (let i of this.adjacentNodes(node))
                if (i > 0 && !fr[i]) dfs1(i);
            stack.push(node);
        }

        let dfs2 = (node) => {
            fr[node] = cnt;
            for (let i of this.adjacentNodes(node)) {
                let n;
                if (i < 0) n = -i;
                else if (this.isEdge(i, node)) n = i;
                else continue;

                if (!fr[n]) {
                    dfs2(n);
                    current.push(n);
                }
            }
                
            
        }
        for (let [k, v] of this.nodes) {
            if (fr[k]) continue;
            fr[k]++;
            dfs1(k);
        }
        console.log(stack);
        fr.fill(0);
        for (let i = stack.length - 1; i >= 0; i--){
            if (fr[stack[i]]) continue;
            current = [stack[i]];
            cnt++;
            fr[stack[i]] = cnt;
            dfs2(stack[i]);
            rez.push([...current]);
        }
        return {
            list: rez,
            map: fr
        }


    }

}
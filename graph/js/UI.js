const UI = {
    colors: ["blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen", "darkmagenta", "cornflowerblue", "crimson", "chocolate", "slateblue", "pink", "mediumseagreen"],
    colorIndex: 1,
    initViewMenu() {
        this.viewMenu = menuBar.appendChild(CustomInputs.category("", {...defaultSettingsTemplate, is: "pop-dialog", name: "view"}, "dialog"));
    
        this.viewMenu.addEventListener("input", function (ev) {
            let g = Graph.selected;
            let top = g.actionsStack.top();
            let chain = CustomInputs.getChainFromEvent(this, ev);
    
            let value = g.setSettings(chain, ev.target.parentElement.get());
    
            if (top?.acumulate) top.newValue = ev.target.parentElement.get();
            else {
                let c = Graph.selected.actionsStack.push(new SettingsChangedCommand(chain, value));
                c.acumulate = true;
            }
        })
    
        this.viewMenu.addEventListener("change", function (ev) {
            let top = Graph.selected.actionsStack.top();
            if(top)top.acumulate = false;
        })
    },
    
    initFileDialog() {
        this.fileMenu = this.menuBar.querySelector("dialog[name='file']");
        this.fileDialog = document.getElementById("file-dialog");
    
        let list = this.fileDialog.querySelector("list-view");
        list.template = function(graph){
            return elementFromHtml(`<label>${graph.settings.name}<input data-id=${graph.id} checked type="checkbox"></label>`);
        }
        this.fileDialog.querySelector("input").addEventListener("change", function () {
            UI.fileDialog.querySelectorAll("list-view input").forEach((el) => el.checked = this.checked);
        })
        
        this.fileDialog.querySelector("button").addEventListener("click", function () {
            let anchor = UI.fileDialog.querySelector("a"), array = [];
    
            UI.fileDialog.querySelectorAll("list-view input:checked")
                .forEach(el => array.push(Graph.get(parseInt(el.getAttribute("data-id"))).toJSON()))
    
            if (array.length) {
                try {
                    const blobURL = createFile(array);
                    anchor.setAttribute("href", blobURL);    anchor.click();
                    setTimeout(() => { URL.revokeObjectURL(blobURL); anchor.href=""}, 1000);
                } catch (e) { console.log(e) }
            }
            this.fileDialog.close();
        })
    },
    
    initForceMenu() {
        this.forceMenu = this.menuBar.appendChild(CustomInputs.category("", { ...physicsTemplate, is: "pop-dialog", name: "physics" }, "dialog"));
        
        this.forceMenu.addEventListener("input", function(ev){
            let chain = CustomInputs.getChainFromEvent(this, ev);
            let value = ev.target.parentElement.get();
            
            switch (chain[0]) {
                case "spring": physicsMode.spring = value / 100; break;
                case "isRunning":break;
                case "frameRate": appData.physicsSettings.frameRate = value; break;
                case "interactions": if (physicsMode.isRunning()) physicsMode.stop(), ACTIONS.togglePhysicsSimulation();
                default: physicsMode[chain[0]] = value;
            }
        })
    },
    
    initActionMenu() {
        this.actionMenu = this.tabArea.appendChild(CustomInputs.category("", { ...actionMenuTemplate, is: "pop-dialog" }, "dialog"));
    },
    
    initTemplateMenu() {
        this.templateMenu = document.getElementById("template");
        let [gTab, nTab, eTab] = this.templateMenu.querySelectorAll(".tabs>*");

        gTab.appendChild(CustomInputs.category("Details", TemplateMenuTemplates.graph));
        nTab.appendChild(CustomInputs.category("Details", TemplateMenuTemplates.node));
        eTab.appendChild(CustomInputs.category("Details", TemplateMenuTemplates.edge));

        this.loadTemplateData("node");
        this.loadTemplateData("edge");
        this.loadTemplateData("graph");

    },
    
    loadTemplateData(tabName) {
        let tab = this.templateMenu.getTab(tabName);
        let templateList = tab.querySelector("list-view");

        templateList.clear();
        switch (tabName) {
            case "graph": {
                break;
            }
            case "node": {
                templateList.list = Array.from(NodeTemplate.map, ([i, _]) => i);
                break;
            }
            case "edge": {
                templateList.list = Array.from(EdgeTemplate.map, ([i, _]) => i);
                break;
            }
        }
        
        templateList.render();
    },
    
    initInspector() {
        this.inspector = document.getElementById("inspector");
        addCustomDrag(UI.inspector, {
            onstart(ev, delta) {
                if (ev.offsetX > 5) return false;
                return true;
            },
            onmove(ev, delta) {
                UI.inspector.size.x -= delta.x;
                UI.inspector.style.width = UI.inspector.size.x + "px";
                UI.inspector.style.cssText += `width: ${UI.inspector.size.x}px; min-width: none;`;
            }
        });
        this.mutationObserver = new MutationObserver((mutations) => {
            
        })
    },

    initHeaderArea() {
        this.headerList = document.querySelector("#main .header");
        this.headerList.template = ([name,id]) => {
            let el = elementFromHtml(`<text-input for="${id}" spellcheck="false" class="graph-header text-hover" maxLength="32">${name}</text-input>`);
            el.getGraph = function () { return Graph.get(parseInt(this.getAttribute("for"))) }
            return el;
        }
        this.headerList.addEventListener("mousedown", function (ev) {
            if (ev.target.matches(".new-graph")) return UI.newGraphMenu.showModal();
            if (ev.target.matches(".header")) return;
            if (ev.detail != 2 && !ev.target.matches(":focus")) ev.preventDefault();
            if (ev.button == 2) return openActionMenu(ev);
            let g = ev.target.getGraph();
            if (g) {
                g.focus();
                this.style.borderImage = `linear-gradient(45deg,${g.settings.main_color},${g.settings.secondary_color}) 1`;
                if (physicsMode.isRunning()) physicsMode.stop();
            }

        });
        this.headerList.addEventListener("change", (ev) =>ev.target.getGraph ? ev.target.getGraph().settings.name=ev.target.value: 0);
    },

    createTabUI(graph) {
        graph.tab = this.tabArea.tabs.appendChild(elementFromHtml(`<graph-tab name=${graph.id}></graph-tab>`));
        graph.tab.graphId = graph.id;
        graph.tab.template = graph.template;
        graph.header = this.headerList.push([graph.name, graph.id]);
    },

    initNewGraphMenu() {
        this.newGraphMenu = document.getElementById("graph-addition-dialog");
        this.newGraphMenu.querySelector("[name=submit]").onclick = (ev) => {
            this.newGraphMenu.close();
            createGraph(this.formatNewGraphData());
        }
    },

    formatNewGraphData() {
        let type = +this.newGraphMenu.querySelector("[name='type input']").value;
        let inputMode = this.newGraphMenu.querySelector("[name='input mode']").value;
        let nodeNumber = this.newGraphMenu.querySelector("[name='node number']").value;
        /**@type {String}  */
        let data = this.newGraphMenu.querySelector(".tabs :not(.hide)").value;
    
        let objectTemplate = JSON.parse(JSON.stringify(defaultGraphJSON));
        objectTemplate.nodeProps = [];
        objectTemplate.type = type;
        let map = new Map();
        let addNode = (i) => {
            objectTemplate.nodeProps.push({ nodeId: i });
            map.set(i, true);
        }
        let exists = (node) => map.has(node);
        let addEdge = (from, to) => objectTemplate.edgeProps.push({ from, to });
    
    
        for (let i = 1; i <= nodeNumber; i++) addNode(i);
    
        switch (inputMode) {
            case "Matrix": {
                let matrix = data.replace(/[a-z]+/g, "").replace(/\[|\]+/g, "\n").split("\n").filter(el => el !== '').map((row) => row.split(/[\ ,.]+/g).filter(el => el !== ''));
                let n = Math.min(matrix.length, nodeNumber);
                
                for (let i = 1; i <= n; i++){
                    for (let j = 1; j <= n; j++)if (parseInt(matrix[i - 1][j - 1])) addEdge(i, j);
                }
                return objectTemplate;
            }
            case "Edge list": {
                let matrix = data.replace(/[a-z]+/g, "").replace(/\[|\]+/g, "\n").split("\n").filter(el => el !== '').map((row) => row.split(/[\ ,.]+/g).filter(el => el !== ''));
                for (let row of matrix) {
                    let a = parseInt(row[0]), b = parseInt(row[1]);
                    if (!a || !b) continue;
                    if (a > nodeNumber && !exists(a)) addNode(a);
                    if (b > nodeNumber && !exists(b)) addNode(b);
    
                    addEdge(a, b);
                }
                return objectTemplate;
            }
            case "Adjacency list": {
                let matrix = data.replace(/[a-z]+/g, "").replace(/\[|\]+/g, "\n").split("\n").filter(el => el !== '').map((row) => row.split(/[\ :,.]+/g).filter(el => el !== ''));
                for (let row of matrix) {
                    let anchor = parseInt(row[0]);
                    if (anchor > nodeNumber && !exists(anchor)) addNode(anchor);
    
                    for (let i = 1; i < row.length; i++){
                        let entry = parseInt(row[i]);
                        if (entry > nodeNumber && !exists(entry)) addNode(entry);
                        addEdge(anchor, entry);
                    }
                }
                return objectTemplate;
            }
            case "Parent array": {
                let array = data.replace(/[a-z]|\n+/g, "").split(/[\ :,.]+/g).filter(el => el !== '');
                let root = array.indexOf("0");
                if (root < 0 || array.lastIndexOf("0") != root) return;
                root++;
                
                for (let i = 1; i <= array.length; i++) {
                    if (i == root) continue;
                    let a = parseInt(array[i - 1]);
                    if (!exists(i)) addNode(i);
                    if (!exists(a)) addNode(a);
                    addEdge(i, a);
                }
    
                return objectTemplate;
            }
        }
    },

    init() {
        this.tabArea = document.getElementById("main");
        this.menuBar = document.getElementById("menu-bar");
        this.menuBar.addEventListener("click", function (ev) {
            let target = ev.target;
            if (!target.parentElement.matches("#menu-bar")) return;
            if (!target.matches("[for]")) return;
            let rect = target.getBoundingClientRect();
            this.querySelector(`[name=${target.getAttribute("for")}]`)?.toggleModal(rect.left, rect.bottom);
            ev.stopPropagation();
        });

        shuffleArray(this.colors);

        this.initHeaderArea();
        //this.initViewMenu();
        this.initFileDialog();
        this.initForceMenu();
        this.initActionMenu();
        this.initTemplateMenu();
        this.initInspector();
        this.initNewGraphMenu();
    },

    createNodeList(id) {
        let list = elementFromHtml(`<list-view autofit="true"  class="node-list" for='${id}' direction='row'></list-view>`);
        list.template = (el) => {
            let text = el.matches?.("graph-node") ? el.textContent : el;
            let child = elementFromHtml(`<div class="text-hover">${text}</div>`);
            return child;
        }
        list.addEventListener("click", function (ev) {
            if (ev === this) return;
            let graph = Graph.get(parseInt(this.getAttribute("for")));
            let node = graph.getNodeUI(parseInt(ev.target.textContent));
            node.scrollIntoView();
            graph.selection.toggle(node);
        })
        list.list = [0];
        return list;
    },

    createEdgeList(id) {
        let list = elementFromHtml(`<list-view autofit="true" class="edge-list" for='${id}' direction='row'></list-view>`);
        list.template = (el) => {
            let gtype = Graph.get(parseInt(list.getAttribute("for"))).type;
            let from = el.matches?.("graph-edge") ? el.from : el[0];
            let to = el.matches?.("graph-edge") ? el.to : el[1];
            let child = elementFromHtml(`<div class="text-hover">${from} ${gtype ? "&#8594" : "&#175"} ${to}</div>`);
            console.log(child)
            return child;
        }
        list.addEventListener("click", function (ev) {
            if (ev === this) return;
            let graph = Graph.get(parseInt(this.getAttribute("for")));
            let [from, _, to] = ev.target.textContent.split(" ");
            let edge = graph.getNodeUI(parseInt(from), parseInt(to));
            edge.scrollIntoView();
            graph.selection.toggle(edge);
        })
        return list;
    },

    createComponentList(id) {
        let list = elementFromHtml(`<list-view></list-view>`);
        list.template = (array) => {
            let item = UI.createNodeList(id);
            /* let rez = elementFromHtml(`<div style=" display: flex; flex-direction: row;">${array.length} </div>`);
            rez.appendChild(item);
 */            item.list = array;
            return item;
        }
        return list;
    },

    highlight() {
        let element = inspector.observed
        Graph.selected.selection.toggle(element);
        element.scrollIntoView();
    }
}

function openActionMenu(ev, graph) {
    
    if (!ev.target.matches("graph-tab, .graph-header") || ev.button != 2) return;

    if (UI.actionMenu.open) return UI.actionMenu.close();
    
    UI.actionMenu.show(ev.clientX+5, ev.clientY+5);
    UI.actionMenu.validate(ev);
}

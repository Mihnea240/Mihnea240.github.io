window.onload = () => {
    document.oncontextmenu = ev => ev.preventDefault();

    let storedGraphs = JSON.parse(sessionStorage.getItem("stored-graphs"));
    let appSettings = JSON.parse(sessionStorage.getItem("app-data"));
    let nodeTemplates = JSON.parse(sessionStorage.getItem("nodeTemplates"));
    let edgeTemplates = JSON.parse(sessionStorage.getItem("edgeTemplates"));
    let graphTemplates = JSON.parse(sessionStorage.getItem("graphTemplates"));

    if (nodeTemplates?.length) {
        for (const t of nodeTemplates) new NodeTemplate(t.name, "", t);
    } else new NodeTemplate("default", defaultTemplateStyls.node);
    
    if (edgeTemplates?.length) {
        for (const t of edgeTemplates) new EdgeTemplate(t.name, "", t);
    } else new EdgeTemplate("default", defaultTemplateStyls.edge);
    
    if (graphTemplates?.length) {
        for (const t of graphTemplates) new EdgeTemplate(t.name, "", t);
    } else  new GraphTemplate("default", defaultTemplateStyls.graph);

    UI.init();

    if (appSettings) {
        mergeDeep(appData, appSettings);
        appData.physicsSettings.spring /= 100;
    }
    mergeDeep(physicsMode, appData.physicsSettings);
    UI.forceMenu.load(appData.physicsSettings);


    if (storedGraphs?.length) {
        for (let i of storedGraphs) createGraph(i);
    } else createGraph();

    window.addEventListener("message", (ev) => {
        let graphs = JSON.parse(ev.data);
        for (const [_, g] of Graph.graphMap) g.delete();
        for (let i of graphs) createGraph(i);
        ev.source.postMessage("close", "*");
    });
}
window.onbeforeunload = (ev) => {
    let array = [];
    for (let [key, value] of Graph.graphMap)array.push(value.toJSON());
    sessionStorage.setItem("stored-graphs", JSON.stringify(array));

    appData.physicsSettings = physicsMode.getSettings();
    sessionStorage.setItem("app-data", JSON.stringify(appData));
    array = [];
    
    for (const [name,t] of NodeTemplate.map)if(name!="default") array.push(t);
    sessionStorage.setItem("nodeTemplates", JSON.stringify(array));
    array = [];

    for (const [name, t] of EdgeTemplate.map) if (name != "default") array.push(t);
    sessionStorage.setItem("edgeTemplates", JSON.stringify(array));
    array = [];

    for (const [name, t] of GraphTemplate.map) if (name != "default") array.push(t);
    sessionStorage.setItem("graphTemplates", JSON.stringify(array));
    array = [];

}
const appData = {
    cursorPos: new Point(),
    cursorVelocity: new Point(),
    dt: 0,
    lastTime:0,
    physicsSettings: {
        frameRate: 5,
        gravity: 0,
        spring: 0.01,
        springIdealLength: 200,
        energyLoss: 0.2,
        drag: 0.01,
        interactions: "All",
    },
}

const physicsMode = new PhysicsMode();

function createGraph(obj = defaultGraphJSON) {
    let newGraph = Graph.parse(obj);

    if (!newGraph) alert("Format invalid");
    else {
        UI.tabArea.tabs.appendChild(newGraph.tab);
        UI.headerList.list.push([newGraph.id, newGraph.settings.name]);
        UI.headerList.appendChild(newGraph.header);
        newGraph.focus();
    }
    return newGraph;
}
function g(id) { return Graph.get(id) }

function saveProtrocol() {
    UI.fileDialog.showModal();
    let list = UI.fileDialog.querySelector("list-view");
    list.clear();
    for (let [_, g] of Graph.graphMap) list.push(g);
}

function createFile(array) {
    let text =`<body style="
        background-image: url('https://insights.som.yale.edu/sites/default/files/styles/max_1300x1300/public/2022-10/space.jpeg?itok=ee8bV8ok');
        background-size:cover;
        display: grid;
        place-items: center;
        ">

        <p style="font-size: 2rem; color: white; ">
            Accept pop-ups to open the website or load this file at <a href="https://mihnea240.github.io/graph/"> Graph maker</a>
        </p>

        <div  style="display: none;" id="data">${JSON.stringify(array)}</div>
        <script>  
            const win=window.open("https://mihnea240.github.io/graph/");
            win.addEventListener("load",(ev)=>{
                win.postMessage(document.getElementById("data").textContent,"*");
                console.log(win);
            })

            setTimeout(()=>{
                win.postMessage(document.getElementById("data").textContent,"*");
                console.log(win);
            },1000);


            window.addEventListener("message",(ev)=>{
                close();
            })

        </script>
    </body>`
    return URL.createObjectURL(new Blob([text], { type: "application/text", }));
}

function loadPotrocol(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);
    reader.addEventListener("load", (ev) => {
        let p1 = reader.result.indexOf('id="data"') + 10;
        let p2 = reader.result.indexOf("</div>", p1);
        let json = reader.result.substring(p1, p2);
        let obj = JSON.parse(json);
        console.log(obj,json)
        for (let i of obj) createGraph(i);
    })
}

const keyBindings = {
    F2: "fullscreen",
    Enter: "blur",
    Delete: "deleteSelection",
    ArrowLeft: "selectionMove",
    ArrowRight: "selectionMove",
    ArrowUp: "selectionMove",
    ArrowDown: "selectionMove",
    c: "copy",
    v: "paste",
    "+": "addNode",
    a: "selectAll",
    z: "undo",
    y: "redo",
    f: "togglePhysicsSimulation"
}
const ACTIONS = {
    fullscreen() { toggleFullScreen() },
    blur(ev) { if (!ev.target.matches("textarea")) document.activeElement.blur() },
    deleteSelection(ev) {
        Graph.selected.selection.deleteAll();
    },
    selectionMove(ev) {
        /**@type {Graph} */
        let G = Graph.selected;
        let selection = G.selection;
        if (selection.empty()) return;
        let nodes = Array.from(selection.nodeSet);
        let top = nodes.at(-1);

        switch (ev.key) {
            case "ArrowRight": {
                for (let i of G.adjacentNodes(top.nodeId)) {
                    if (i < 0) continue;
                    let n = G.getNodeUI(i);
                    let e = G.getEdgeUI(top.nodeId, i);

                    if (!n.selected) {
                        selection.toggle(n);
                        if (!e.selected) selection.toggle(e);
                        break;
                    } else if (!e.selected) {
                        selection.toggle(e); break;
                    }
                }
                break;
            }
            case "ArrowLeft": {
                selection.toggle(G.getEdgeUI(nodes.at(-2).nodeId, top.nodeId));
                selection.toggle(top);
                break;
            }
            case "ArrowUp": case "ArrowDown": {
                let dir = ev.key == "ArrowUp" ? -1 : 1;
                let top1 = nodes.at(-2);

                let array = Array.from(G.adjacentNodes(top1.nodeId));
                let i = array.indexOf(top.nodeId), j = i, slide = top;

                while (slide.selected) {
                    j = (j + dir + array.length) % array.length;
                    if (i == j) break;
                    slide = G.getNodeUI(array[j]);
                }
                if (i == j) break;


                selection.toggle(top);
                selection.toggle(G.getEdgeUI(top1.nodeId, top.nodeId));
                selection.toggle(slide);
                selection.toggle(G.getEdgeUI(top1.nodeId, slide.nodeId));
                break;
            }
        }
        ev.preventDefault();
    },
    copy(ev) {
        if (ev.repeat || document.activeElement != document.body || !ev.ctrlKey) return;
        let g = Graph.selected;

        if (g.selection.empty()) {
            navigator.clipboard.writeText(JSON.stringify(g)).then(
                (resolve) => {
                    alert(`Moved copy of "${g.settings.graph.name}" to clipboard \n`);
                },
                (error) => console.log(error)
            )
        } else {
            navigator.clipboard.writeText(JSON.stringify(g.selection)).then(
                (resolve) => {
                    alert(`Copied selection\n`);
                },
                (error) => console.log(error)
            )

        }
        
    },
    async paste(ev) {
        if (ev.repeat || document.activeElement != document.body || !ev.ctrlKey) return;
        let data = await navigator.clipboard.readText();
        let obj = JSON.parse(data);
        
        if (obj.settings) createGraph(obj);
        else if (obj.nodes) GraphSelection.parseFromJSON(obj);
    },
    addNode() {
        let newNode = Graph.selected.addNode();
        let np = newNode.parentElement.screenToWorld(appData.cursorPos.clone());
        newNode.position(np.x, np.y);
    },
    selectAll(ev) {
        if (ev.ctrlKey) {
            let g = Graph.selected;
            for (let el of g.tab.children) g.selection.toggle(el);
        }
    },
    undo(ev) {
        if (!ev.ctrlKey) return;
        if (UI.viewMenu.open) Graph.selected.settingsStack.undo();
        else Graph.selected.actionsStack.undo();

    },
    redo(ev) {
        if (!ev.ctrlKey) return;
        if (UI.viewMenu.open) Graph.selected.settingsStack.redo();
        else Graph.selected.actionsStack.redo();
    },
    togglePhysicsSimulation(ev) {
        //if (ev && !ev.ctrlKey) return;
        if (physicsMode.isRunning()) {
            UI.menuBar.querySelector("[for='physics']")?.classList.remove("active");
            return physicsMode.stop();
        }
        UI.menuBar.querySelector("[for='physics']").classList.add("runnig");

        /**@type {Graph}*/
        let g = Graph.selected;
        let list = g.tab.getNodeArray();
        let rect = g.tab.viewRect;
        let check;
        let dt = 1 / physicsMode.frameRate;
        switch (physicsMode.interactions) {
            case "Between direct neighbours": check = (a, b) => g.isEdge(a.nodeId, b.nodeId); break;
            case "Between neighbours": check = (a, b) => (g.isEdge(a.nodeId, b.nodeId) || g.isEdge(a.nodeId, -b.nodeId)); break;
            default: check = () => true;
        }

        physicsMode.update = () => {
            for (let i = 0; i < list.length; i++) {
                let a = list[i];
                for (let j = i + 1; j < list.length; j++) {
                    let b = list[j];
                    if (check(a, b)) physicsMode.calculateForces(a, b);
                }
            }

            for (const n of list) {
                if (n.isStatic) continue;
                n.transform.velocity.multiplyScalar(parseFloat(1-physicsMode.drag));
                n.transform.update(dt);

                if (n.transform.position.x < rect.x || n.transform.position.x > rect.x + rect.width) n.transform.velocity.x *= -1;
                if (n.transform.position.y < rect.y || n.transform.position.y > rect.y + rect.height) n.transform.velocity.y *= -1;
                n.update();

                n.transform.acceleration.set(0, 0);
            }
        }
        physicsMode.start(dt);
    }

}


function test(n) {
    let g = Graph.get(1);
    for (let i = 1; i <= n; i++)g.addNode();
}


document.addEventListener("keydown", (ev) => {
    ACTIONS[keyBindings[ev.key]]?.(ev);
});

document.addEventListener("mousemove", (ev) => {
    appData.dt = Date.now() - appData.lastTime;
    appData.lastTime = Date.now();
    appData.cursorVelocity.set(ev.clientX, ev.clientY).sub(appData.cursorPos).multiplyScalar(1 / appData.dt);
    appData.cursorPos.set(ev.clientX, ev.clientY);
})

window.onload = () => {
    initGreatMenus();
    initInspector();
    document.oncontextmenu = ev => ev.preventDefault();

    let storedGraphs = JSON.parse(sessionStorage.getItem("stored-graphs"));
    let appSettings = JSON.parse(sessionStorage.getItem("app-data"));
    let nodeTemplates = JSON.parse(sessionStorage.getItem("nodeTemplates"));
    let edgeTemplates = JSON.parse(sessionStorage.getItem("edgeTemplates"));

    if (appSettings) {
        mergeDeep(appData, appSettings);
        appData.physicsSettings.spring /= 100;
    }
    mergeDeep(physicsMode, appData.physicsSettings);
    greatMenus.forceMenu.querySelector(".category").load(appData.physicsSettings);

    if (nodeTemplates?.length) {
        for (const t of nodeTemplates) new NodeTemplate(t.name, "", t);
    } else new NodeTemplate("default", nodeDefaultTemplate);
    
    if (edgeTemplates?.length) {
        for (const t of edgeTemplates) new EdgeTemplate(t.name, "", t);
    } else  new EdgeTemplate("default", edgeDefaultTemplate);


    if (storedGraphs?.length) {
        for (let i of storedGraphs) createGraph(i);
    } else createGraph();

    window.addEventListener("message", (ev) => console.log(ev));
}
window.onbeforeunload = (ev) => {
    let array = [];
    for (let [key, value] of Graph.graphMap)array.push(value.toJSON());
    sessionStorage.setItem("stored-graphs", JSON.stringify(array));

    appData.physicsSettings = physicsMode.getSettings();
    sessionStorage.setItem("app-data", JSON.stringify(appData));
    array = [];
    
    for (const [_,t] of NodeTemplate.map) array.push(t);
    sessionStorage.setItem("nodeTemplates", JSON.stringify(array));
    array = [];

    for (const [_,t] of EdgeTemplate.map) array.push(t);
    sessionStorage.setItem("edgeTemplates", JSON.stringify(array));
    array = [];

}
const appData = {
    cursorPos: new Point(),
    cursorVelocity: new Point(),
    dt: 0,
    lastTime:0,
    physicsSettings: {
        frameRate: 24,
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
    else newGraph.focus();
}
function g(id) { return Graph.get(id) }

function savePotrocol() {
    let window = menuBar.querySelector("dialog");
    let gList = window.querySelector("div.list");
    gList.innerHTML = "";
    for (let [i, _] of Graph.graphMap) {
        gList.appendChild(elementFromHtml(`<label><input data-id=${i} checked type="checkbox">${Graph.get(i).settings.graph.name}</label>`));
    }
    document.body.click();
    window.showModal();
    let saveButton = window.querySelector("button");
    saveButton.onclick ||= () => {
        let a = document.createElement("a"), array = [];
        document.body.appendChild(a);

        window.querySelectorAll(".list input:checked").forEach(el => array.push(Graph.get(parseInt(el.getAttribute("data-id"))).dataTemplate()))

        try {
            const blobURL = URL.createObjectURL(new Blob([JSON.stringify(array)], { type: "application/json", }));
            a.setAttribute("href", blobURL);
            a.setAttribute("download", "My Graphs");
            a.click();
            setTimeout(() => { URL.revokeObjectURL(blobURL); a.remove(); }, 1000);
        } catch (e) {
            console.log(e);
        }
        window.close();
    }
}
function loadPotrocol(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.readAsText(file);
    reader.addEventListener("load", (ev) => {
        let obj = JSON.parse(reader.result);
        for (let i of obj) createGraph(i);
    })
}

const keyBindings = {
    F2: "fullscreen",
    Enter: "blur",
    Escape: "closeModal",
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
    closeModal(ev) { graphDialog.close() },
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
        if (greatMenus.viewMenu.open) Graph.selected.settingsStack.undo();
        else Graph.selected.actionsStack.undo();

    },
    redo(ev) {
        if (!ev.ctrlKey) return;
        if (greatMenus.viewMenu.open) Graph.selected.settingsStack.redo();
        else Graph.selected.actionsStack.redo();
    },
    togglePhysicsSimulation(ev) {
        //if (ev && !ev.ctrlKey) return;
        if (physicsMode.isRunning()) {
            menuBar.querySelector("button[for='physics']")?.classList.remove("active");
            return physicsMode.stop();
        }
        menuBar.querySelector("button[for='physics']").classList.add("active");

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
        physicsMode.start(list, dt);
    }

}


function openNodeCreationDialog() {

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

window.onload = () => {
    initGreatMenus();
    document.oncontextmenu = ev => ev.preventDefault();
    let storedGraphs = JSON.parse(sessionStorage.getItem("stored-graphs"));
    if (storedGraphs?.length) {
        for (let i of storedGraphs) createGraph(i);
    }else createGraph(); 
}
window.onbeforeunload = () => {
    let array = [];
    for (let [key, value] of graphs) array.push(value.dataTemplate());
    sessionStorage.setItem("stored-graphs", JSON.stringify(array));
}

/** @type {Map<string , Graph>}*/
const graphs = new Map();

const physicsMode = new PhysicsMode();
const appData = {
    cursorPos: new Point(),
}

function createGraph(obj=defaultGraphJSON) {
    let newGraph = Graph.parse(obj);

    if (!newGraph) alert("Format invalid");
    else  newGraph.focus();
}
function g(id){return graphs.get(id)}

function savePotrocol() {
    let window = menuBar.querySelector("dialog");
    let gList = window.querySelector("div.list");
    gList.innerHTML = "";
    for (let [i,_] of graphs) {
        gList.appendChild(elementFromHtml(`<label><input data-id=${i} checked type="checkbox">${graphs.get(i).settings.graph.name}</label>`));
    }
    document.body.click();
    window.showModal();
    let saveButton = window.querySelector("button");
    saveButton.onclick ||= () => {
        let a = document.createElement("a"), array=[];
        document.body.appendChild(a);

        window.querySelectorAll(".list input:checked").forEach(el => array.push(graphs.get(parseInt(el.getAttribute("data-id"))).dataTemplate()))

        try {
            const blobURL = URL.createObjectURL(new Blob([JSON.stringify(array)], { type: "application/json", }));
            a.setAttribute("href", blobURL);
            a.setAttribute("download", "");
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
    blur(ev){ if(!ev.target.matches("textarea")) document.activeElement.blur() },
    closeModal(ev){ graphDialog.close()},
    deleteSelection(ev){
        if(!ev.ctrlKey)graphs.selected.selection.deleteNodes();
        graphs.selected.selection.deleteEdges();
    },
    selectionMove(ev){
        /**@type {Graph} */
        let G = graphs.selected;
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
                let i = array.indexOf(top.nodeId), j =i, slide=top;
                
                while (slide.selected) {
                    j = (j + dir + array.length) % array.length;
                    if (i == j) break;
                    slide = G.getNodeUI(array[j]);
                }
                if (i == j) break;
                

                selection.toggle(top);
                selection.toggle(G.getEdgeUI(top1.nodeId, top.nodeId));
                selection.toggle(slide);
                selection.toggle(G.getEdgeUI(top1.nodeId,slide.nodeId));
                break;
            }
        }
        ev.preventDefault();
    },
    copy(ev){
        if (ev.repeat || document.activeElement!=document.body || !ev.ctrlKey) return;
        let data = JSON.stringify(graphs.selected.dataTemplate());
        navigator.clipboard.writeText(data).then(
            (resolve) => {
                alert(`Moved copy of "${graphs.selected.settings.graph.name}" to clipboard \n`);
            },
            (error) => console.log(error)
        )
    },
    async paste(ev) {
        if (ev.repeat || document.activeElement!=document.body || !ev.ctrlKey) return;
        let data = await navigator.clipboard.readText();
        createGraph(JSON.parse(data));
    },
    addNode() {
        let newNode = graphs.selected.addNode();
        let np = newNode.parentElement.screenToWorld(appData.cursorPos.clone());
        newNode.position(np.x, np.y);
    },
    selectAll(ev) {
        if (ev.ctrlKey) {
            let g = graphs.selected;
            for (let el of g.tab.children) g.selection.toggle(el);
        }
    },
    undo(ev) {
        if (!ev.ctrlKey) return;
        if (greatMenus.viewMenu.open) graphs.selected.settingsStack.undo();
        else graphs.selected.actionsStack.undo();
    },
    redo(ev) {
        if (!ev.ctrlKey) return;
        if (greatMenus.viewMenu.open) graphs.selected.settingsStack.redo();
        else graphs.selected.actionsStack.redo();
    },
    togglePhysicsSimulation() {
        if (physicsMode.isRunning()) return physicsMode.stop();

        /**@type {Graph}*/
        let g = graphs.selected;
        let list = g.tab.getNodeArray();
        let p = new Point(),p1=new Point();
        let rect = g.tab.viewRect;
        
        
        for (let n of list)n.transform.velocity.copy(n.transform.acceleration.set(0, 0));

        physicsMode.update = () => {
            for (let i = 0; i < list.length; i++){
                let a = list[i];
                for (let j = i+1; j < list.length; j++){
                    let b = list[j], force = 0;
                    p.copy(a.transform.position).sub(b.transform.position);
                    let dist = p.mag();

                    force = 0.01 * (dist - 300);
                    //if ((g.isEdge(a.nodeId, b.nodeId) || g.isEdge(b.nodeId, a.nodeId)) &&dist<100) force *= -1;

                    //let force = 10 / (p.magSq());
                    if (force > 50) force = 50;
                    //if (force < 0.1) force = 0;
                    
                    p1.copy(p.normalize());
                    p.multiplyScalar(-force);
                    p1.multiplyScalar(force);
                    a.transform.acceleration.add(p);
                    b.transform.acceleration.add(p1);
                }
                a.transform.velocity.set(0,0);
            }
            for (let n of list) {
               /*  p.copy(appData.cursorPos).sub(n.transform.position).normalize().multiplyScalar(0.1)
                n.transform.acceleration.add(p);
                n.transform.velocity.normalize(); */
                n.transform.update();
                if (n.transform.position.x < rect.x || n.transform.position.x > rect.x + rect.width) n.transform.velocity.x *= -1;
                if (n.transform.position.y < rect.y || n.transform.position.y > rect.y + rect.height) n.transform.velocity.y *= -1;
                n.update();
                n.transform.acceleration.set(0, 0);
                //n.transform.velocity.normalize();
            }
            
        }
        physicsMode.start(list, 10);
    }

}

document.addEventListener("keydown", (ev) => {
    //console.log(ev.key);
    ACTIONS[keyBindings[ev.key]]?.(ev);
});

document.addEventListener("mousemove", (ev) => {
    appData.cursorPos.set(ev.clientX, ev.clientY);
})


function test(n, g = 1) {
    let G = graphs.get(g);
    for (let i = 1; i < n; i++)G.addNode();
}

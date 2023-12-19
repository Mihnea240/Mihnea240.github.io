window.onload = () => {
    initGreatMenus();
    createGraph();
}

/**
 * @type {Map<string , Graph>} 
 * 
*/
const graphs = new Map();

function createGraph() {
    let newGraph = new Graph("", UNORDERED);
    graphs.set(newGraph.id, newGraph);

    newGraph.focus();
    newGraph.addNode();
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
}
const ACTIONS = {
    fullscreen: () => toggleFullScreen(),
    blur: (ev) => { document.activeElement.blur() },
    closeModal: (ev) => { graphDialog.close(); },
    deleteSelection: (ev) => {
        /**@type {Graph} */
        let g = graphs.selected;

        console.log(g.selection);
        if (g.selection.empty()) return;
        let { nodeSet, edgeSet } = g.selection;
        console.log(nodeSet, edgeSet);

        for (let n of nodeSet) g.removeNode(n.nodeId);
        for (let e of edgeSet) g.removeEdge(e.fromNode, e.toNode);
        g.selection.clear();
    },
    selectionMove: (ev) => {
        /**@type {Graph} */
        let G = graphs.selected;
        let selection = G.selection;
        if (selection.empty()) return;
        let nodes = selection.nodeArray();
        let cn = nodes.back();

        switch (ev.key) {
            case "ArrowRight": {

                let set = G.nodes.get(cn.nodeId);
                for (let i of set) {
                    let n = G.tab.getNode(i);
                    console.log(n.selected);
                    if (n.selected) continue;
                    selection.toggle(n);
                    break;
                }
                break;
            }
            case "ArrowLeft": {
                selection.toggle(cn);
                break;
            }
            case "ArrowUp": case "ArrowDown": {
                let dir = ev.key == "ArrowUp" ? -1 : 1;
                let ccn = nodes.back(1);
                let set = G.nodes.get(ccn.nodeId);
                let array = Array.from(set);
                let i = array.indexOf(cn.nodeId);
                i = (i + dir + array.length) % array.length;
                selection.toggle(cn);
                selection.toggle(G.tab.getNode(array[i]));
                break;
            }
        }
        ev.preventDefault();
    }

}

document.addEventListener("keydown", (ev) => {
    console.log(ev.key);
    ACTIONS[keyBindings[ev.key]]?.(ev);
})


function test(n, g = 1) {
    let G = graphs.get(g);
    for (let i = 1; i < n; i++)G.addNode();
}

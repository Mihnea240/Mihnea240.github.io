window.onload = () => {
    createGraph();
}

/**
 * @type {Map<string , Graph>} 
 * 
*/
const graphs = new Map();

function createGraph() {
    let newGraph = new Graph("",UNORDERED);
    graphs.set(newGraph.id, newGraph);

    newGraph.focus();
    graphs.selected = newGraph;
}


const keyBindings = {
    F2: "fullscreen",
    Enter: "blur",
    Escape: "closeModal",
    Delete: "deleteSelection"
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
        let { nodeSet, edgeSet} = g.selection;
        console.log(nodeSet, edgeSet);

        for (let n of nodeSet) g.removeNode(n.nodeId);
        for (let e of edgeSet) g.removeEdge(e.fromNode, e.toNode);
        g.selection.clear();
    }
}

document.addEventListener("keydown", (ev) => {
    ACTIONS[keyBindings[ev.key]]?.(ev);
})


function test(n, g = 1) {
    let G = graphs.get(g);
    for (let i = 1; i < n; i++)G.addNode();
}

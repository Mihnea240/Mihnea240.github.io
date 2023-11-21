window.onload = () => {
    createGraph();
}

const graphs = new Map();

function createGraph() {
    let newGraph = new Graph("",UNORDERED);
    graphs.set(newGraph.id, newGraph);

    newGraph.focus();
    graphs.selected = newGraph;
}


const keyBindings = {
    F2: "fullscreen",
}
const ACTIONS = {
    fullscreen: () => toggleFullScreen(),
}

document.addEventListener("keydown", (ev) => {
    ACTIONS[keyBindings[ev.key]]?.();
})

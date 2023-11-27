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
    Enter: "blur",
}
const ACTIONS = {
    fullscreen: () => toggleFullScreen(),
    blur: ()=>document.activeElement.blur(),
}

document.addEventListener("keydown", (ev) => {
    ACTIONS[keyBindings[ev.key]]?.(ev);
})

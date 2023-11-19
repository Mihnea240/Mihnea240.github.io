window.onload = () => {
    createGraph();
}

const graphs = new Map();

function createGraph() {
    let newGraph = new Graph("",ORDERED);
    graphs.set(newGraph.id, newGraph);

    newGraph.focus();
    graphs.selected = newGraph;
}

newGraphButton.addEventListener("click", (ev) => {
    createGraph();
    ev.stopImmediatePropagation(); ev.stopPropagation();
})


window.onload = () => {
    createGraph();
}

const graphs = new Map();
function getGraphByName(name) {
    let headers = headerArea.children;
    for (h of headers) {
        if (h.innerText === name) return graphs.get(h.getAttribute("data-id"));
    }
}

function createGraph() {
    let newGraph = new Graph("",ORDERED);
    graphs.set(newGraph.id, newGraph);

    newGraph.focus();
    graphs.selected = newGraph;
}
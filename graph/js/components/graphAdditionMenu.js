const newGraphDialog = document.getElementById("graph-addition-dialog");


//close when clicked on backdrop
newGraphDialog.addEventListener("click", (ev) => {
    let rect = newGraphDialog.getBoundingClientRect();
    if (ev.target.tagName !== "DIALOG") return;
    if ((ev.clientX > rect.right || ev.clientX < rect.left) ||
        ((ev.clientY > rect.bottom || ev.clientY < rect.top))) newGraphDialog.close();
})

newGraphDialog.querySelector(`button[name="submit"]`).onclick = (ev) => {
    newGraphDialog.close();
    createGraph(formatNewGraphData());
}

function formatNewGraphData() {
    let type = +newGraphDialog.querySelector("[name='type input']").value;
    let inputMode = newGraphDialog.querySelector("[name='input mode']").value;
    let nodeNumber = newGraphDialog.querySelector("[name='node number']").value;
    /**@type {String}  */
    let data = newGraphDialog.querySelector(".tabs :not(.hide)").value;

    let objectTemplate = JSON.parse(JSON.stringify(defaultGraphJSON));
    objectTemplate.type = type;
    objectTemplate.data = {
    }
    let addNode = (i) => {
        objectTemplate.data.nodes.push(i);
        objectTemplate.data.connections[i] = [];
    }
    let exists = (node) => !!objectTemplate.data.connections[node];
    let addEdge = (from, to) => objectTemplate.data.connections[from].push(to);


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
                if (type == UNORDERED) addEdge(b, a);
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
}




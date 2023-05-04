var selection = {
    edges: new Set(),
    nodes: new Set(),
    graph: undefined,
    clear() {
        this.graph = undefined;
        this.edges.forEach((ed) => {
            ed.html.classList.toggle("selected");
        })
        this.nodes.forEach((nd) => {
            nd.html.classList.toggle("selected");
        })
        this.edges.clear();
        this.nodes.clear();
        document.body.removeEventListener("click", this.clickHandle);
        document.body.removeEventListener("contextmenu", openSelectionMenu);

        closeSelectionMenu();
    },
    clickHandle: function (ev) {
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        let class_list = ev.target.classList;
        if (class_list.length != 0 && class_list[0] === "edge" || class_list[0] === "node") return;
        if (selection_menu.contains(ev.target)) return;
        if (document.getElementById("info-area").contains(ev.target)) return;
        selection.clear();

    },
    push(element) {
        let name = element.constructor.name;
        if (!this.empty() && this.graph != element.parentGraph) this.clear();

        this.graph = element.parentGraph;
        if (name === "Node") {
            if (this.nodes.has(element)) this.nodes.delete(element);
            else this.nodes.add(element);
        }
        if (name === "Edge") {
            if (this.edges.has(element)) this.edges.delete(element)
            else this.edges.add(element);
        }

        element.html.classList.toggle("selected");
        if (this.empty()) this.clear();

        document.body.addEventListener("click", this.clickHandle);
        document.body.addEventListener("contextmenu", openSelectionMenu);


    },
    empty() { return !(this.nodes.size + this.edges.size) },


}, selection_menu = document.getElementById("selection-menu");

function openSelectionMenu(ev) {
    ev.preventDefault();
    if (ev.ctrlKey || selection.empty()) return false;
    selection_menu.style.display = "block";
    selection_menu.style.left = ev.pageX + 10 + "px";
    selection_menu.style.top = ev.pageY + 10 + "px";

    document.querySelectorAll("#selection-menu li").forEach((li) => {
        li.classList.toggle("hide", !window[li.getAttribute("data-check")]());
    })
}
function closeSelectionMenu() {
    selection_menu.style.display = "none";
}


function checkNotNeeded() { return true; }
function removeFromSelection() {
    selection.nodes.forEach((nd) => nd?.delete());
    selection.edges.forEach((ed) => ed?.delete());
    selection.clear();
    closeSelectionMenu();
}


//Menu options

function invertCheck() {
    if (selection.nodes.size != 0) return false;
    if (selection.graph.type == "Unordered") return false;
    let [first] = selection.edges;
    if (selection.edges.size == 1 && selection.graph.edge(first.son, first.parent)) return false;
    return true;
}
function reverseEdge() {
    let parent = selection.graph;
    for (const ed of selection.edges) {
        let n2 = ed.son, n1 = ed.parent;
        if (parent.edge(n2, n1)) continue;
        parent.removeEdge(n1, n2);
        parent.addEdge(n2, n1);
    }
    selection.clear();
}


function BFScheck() { return selection.nodes.size != 0 }
function DFScheck() { return BFScheck() }
function startBFS(ev) {
    let n = selection.graph.getLastID();
    let queue = [], fr = new Array(n + 1).fill(0);
    for (const x of selection.nodes) {
        queue.push(x.id);
        fr[x.id] = 1;
    }
    closeSelectionMenu();
    let BFS_step = (ev) => {
        if (!queue.length || selection.empty()) return document.removeEventListener("keydown", BFS_step);
        let newQ = [];
        for (const x of queue) {
            for (const id in selection.graph.node(x).list) {
                if (fr[id]) continue;
                fr[id]++;
                selection.push(selection.graph.edge(x, id));
                selection.push(selection.graph.node(id));
                newQ.push(id);
            }
        }
        queue = newQ;

    };

    document.addEventListener("keydown", BFS_step);

}

function subgraphFromSelection(ev) {
    let input = '', list = {};
    for (const nd of selection.nodes) list[nd.id] = [];
    for (const ed of selection.edges) {
        list[ed.parent].push(ed.son);
    }

    for (const k in list) input += k + " : " + list[k].join(" ") + "\n";
    let n = new Graph(input, "Adjacency list", selection.graph.type);
    n.name("Subgraph from " + selection.graph.name());

    n.toggleHide();
    let center = selection.graph.center();
    let offset = {
        x: ev.pageX - center.x,
        y: ev.pageY - center.y
    }
    console.log(offset);
    for (const nd in n.nodes) {
        let p = selection.graph.node(nd).position();
        p.x += offset.x; p.y += offset.y;
        n.node(nd).position(p.x, p.y);
    }

    n.toggleHide();
    selection.clear();

    graphs[n.id] = n;

    return n;
}

/*function startDFS(){
    closeSelectionMenu();
    let stack=Array.from(selection.nodes),graph=selection.graph;
    let fr=new Array(graph.getLastID()+1).fill(0);

    for(const nd of stack)fr[nd.id]++;

    let push=(el)=>{
        fr[el.id]+=2;
        selection.push(graph.edge(stack.back().id,el.id));
        selection.push(el);
        stack.push(el);
        return el;
    },
    pop=()=>{
        let el=stack.pop();
        if(stack.length==0){
            selection.clear();
            document.removeEventListener("keydown",trigger);
            return;
        }
        selection.push(graph.edge(stack.back().id,el.id));
        selection.push(el);
        return el;
    }
    
    let moveSideways=(direction)=>{ 
        if(stack.length<1)return;
        moveUpDown(-1);
        moveUpDown(1);
        /*let last=pop(),children=Object.keys(stack.back().list);
        let index=children.indexOf(`${last.id}`),i;
       
        for(i=index+direction; i!=index-direction; i+=direction){ 
            console.log(index,children);
            if(i>=children.length)i=0;
            else if(i<0)i=children.length-1;
            if(fr[children[i]])continue;
            break;
        }
        push(graph.node(children[i]));
    },
    moveUpDown=(direction)=>{
        if(direction==1){
            console.log(fr);
            for(const k in stack.back().list){
                if(fr[k])continue;
                push(graph.node(k));
                return;
            }
            pop();
        }else if(direction==-1)pop();
    }
    let trigger=(ev)=>{
        console.log(selection);
        if(selection.empty()){
            document.removeEventListener("keydown",trigger);
            selection.clear();
        }
        ev.preventDefault();
        if(ev.key=="ArrowLeft")moveSideways(-1);
        else if(ev.key=="ArrowRight")moveSideways(1);
        else if(ev.key=="ArrowDown")moveUpDown(1);
        else if(ev.key=="ArrowUp")moveUpDown(-1);
    }
    document.addEventListener("keydown",trigger);
}*/

function startDFS() {
    closeSelectionMenu();
    let resolveAfterInput = () => {
        return new Promise((resolve) => {
            if(selection.empty())resolve(0);
            document.addEventListener("keydown", (ev) => {
                ev.preventDefault();
                resolve(ev.key);
            }, { once: true })
        })
    }

    let graph=selection.graph,fr=new Array(graph.getLastID()+1).fill(0),stack=[];

    let add=(node)=>{
        selection.push(graph.node(node));
        selection.push(graph.edge(stack.back(),node));
        stack.push(node);  fr[node]++;
    },
    remove=()=>{
        let node=stack.pop();
        fr[node]--;
        selection.push(graph.node(node));
        selection.push(graph.edge(stack.back(),node));
    }


    let dfs = async (node) => {
        let response=await resolveAfterInput(); 

        for(const nd in graph.node(node).list){ 
            if(fr[nd])continue;
            if (response == "ArrowLeft") continue;
            if (response == "ArrowRight") continue;
            if (response == "ArrowUp") return;
            if (response == "ArrowDown") {
                add(nd);
                if(await dfs(nd)===false)return false;
                
                remove(node);
                response=await resolveAfterInput();
            }else if(response==0)return false;
        }
    }


    let start = async ()=>{
        for(const nd of selection.nodes){
            fr.fill(0);
            stack.push(nd.id); fr[nd.id]++;
            await dfs(nd.id);
            selection.push(nd);
        }
    }
    start();
}
var selection={
    edges: new Set(),
    nodes: new Set(),
    graph: undefined,
    clear(){
        this.graph=undefined;
        this.edges.forEach((ed)=>{
            ed.html.classList.toggle("selected");
        })
        this.nodes.forEach((nd)=>{
            nd.html.classList.toggle("selected");
        })
        this.edges.clear();
        this.nodes.clear();
        document.body.removeEventListener("click",this.clickHandle); 
        document.body.removeEventListener("contextmenu",openSelectionMenu);
        closeSelectionMenu();
    },
    clickHandle: function(ev){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        let class_list=ev.target.classList;
        if(class_list.length!=0&&class_list[0]==="edge"||class_list[0]==="node")return;
        if(selection_menu.contains(ev.target))return;
        if(document.getElementById("info-area").contains(ev.target))return;
        selection.clear();
       
    },
    push(element){
        let name=element.constructor.name;
        if(!this.empty()&&this.graph!=element.parentGraph)this.clear();

        this.graph=element.parentGraph;
        if(name==="Node"){
            if(this.nodes.has(element))this.nodes.delete(element);
            else this.nodes.add(element);
        }
        if(name==="Edge"){ 
            if(this.edges.has(element))this.edges.delete(element)
            else this.edges.add(element); 
        }
       
        element.html.classList.toggle("selected"); 
        if(this.empty())this.clear();
        
        document.body.addEventListener("click",this.clickHandle);
        document.body.addEventListener("contextmenu",openSelectionMenu);
        
        
    },
    empty(){return !(this.nodes.size+this.edges.size)},


}, selection_menu=document.getElementById("selection-menu");

function openSelectionMenu(ev){
    ev.preventDefault();
    if(ev.ctrlKey||selection.empty())return false;
    selection_menu.style.display="block";
    selection_menu.style.left=ev.pageX+10+"px";
    selection_menu.style.top=ev.pageY+10+"px";

    document.querySelectorAll("#selection-menu li").forEach((li)=>{
        li.classList.toggle("hide", !window[li.getAttribute("data-check")]());
    })
}
function closeSelectionMenu(){
    selection_menu.style.display="none";
}


function checkNotNeeded(){return true;}
function removeFromSelection(){
    selection.nodes.forEach((nd)=>nd?.delete());
    selection.edges.forEach((ed)=>ed?.delete());
    selection.clear();
    closeSelectionMenu();
}


//Menu options

function invertCheck(){
    if(selection.nodes.size!=0)return false;
    if(selection.graph.type=="Unordered")return false; 
    let [first]=selection.edges;
    if(selection.edges.size==1&&selection.graph.edge(first.son,first.parent))return false;
    return true;
}
function reverseEdge(){
    let parent = selection.graph;
    for(const ed of selection.edges){
        let n2=ed.son ,n1=ed.parent;
        if(parent.edge(n2,n1))continue;
        parent.removeEdge(n1,n2);
        parent.addEdge(n2,n1);
    }
    selection.clear();
}


function BFScheck(){return selection.nodes.size!=0}
function startBFS(ev){
    let n=selection.graph.getLastID();
    let queue=[],fr=new Array(n+1).fill(0);
    for(const x of selection.nodes){
        queue.push(x.id);
        fr[x.id]=1;
    }
    closeSelectionMenu();
    let BFS_step=(ev)=>{
        let newQ=[];
        for(const x of queue){
            for(const id in selection.graph.node(x).list){
                if(fr[id])continue;
                fr[id]++;
                selection.push(selection.graph.edge(x,id));
                selection.push(selection.graph.node(id));
                newQ.push(id);
            }
        }
        queue=newQ;
        if(!queue.length||selection.empty())document.removeEventListener("keydown",BFS_step);
    };

    document.addEventListener("keydown",BFS_step);

}
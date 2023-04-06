var selection={
    edges: new Set(),
    nodes: new Set(),
    clear(){
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
        ev.stopPropagation(); ev.stopImmediatePropagation();
        let class_list=ev.target.classList;
        if(class_list.length!=0&&class_list[0]==="edge"||class_list[0]==="node")return;
        if(selection_menu.contains(ev.target))return;
        if(document.getElementById("info-area").contains(ev.target))return;
        selection.clear();
       
    },
    push(element){
        let name=element.constructor.name;
        if(!this.empty()){
            const [x]=this.nodes;
            const [y]=this.edges;
            if(x&&x.parentGraph!=element.parentGraph)this.clear();
            if(y&&y.parentGraph!=element.parentGraph)this.clear();
        }
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
    empty(){
        return (this.edges.size+this.nodes.size==0);
    }
}, selection_menu=document.getElementById("selection-menu");

function openSelectionMenu(ev){
    if(ev.ctrlKey||selection.empty())return false;
    ev.preventDefault();
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
    [first]=selection.edges;   
    if(first.parentGraph.type=="Unordered")return false; 
    if(selection.edges.size==1&&first.parentGraph.edge(first.son,first.parent))return false;
    return true;
}
function reverseEdge(){
    let [parent]=selection.edges;
    parent=parent.parentGraph;
    for(const ed of selection.edges){
        let n1=ed.parent, n2=ed.son;
        if(parent.edge(n2,n1))continue;
        parent.removeEdge(n1,n2);
        parent.addEdge(n2,n1);
    }
    selection.clear();
}

function decoupleCheck(){return selection.edges.size==1&&selection.nodes.size==0;}
function decouple(event){
    event.stopPropagation();
    let [first]=selection.edges;
    let nd=first.parentGraph.nodes[first.parent];

    let tracker=new Tracker(); tracker.distance_offset=nd.html.offsetWidth;
    first.parentGraph.html.appendChild(tracker.html);
    
    selection.clear();
    first.html.classList.add("hide");
    
    let f=function(ev){
        first.parentGraph.html.removeChild(tracker.html);
        first.delete();
        if(ev.target.classList[0]=="node"){
            first.parentGraph.addEdge(nd.id,parseInt(ev.target.textContent));
        }else{
            let New=first.parentGraph.addNode();
            first.parentGraph.addEdge(nd.id,New.id);
            New.position(ev.pageX,ev.pageY);
        }
        document.body.removeEventListener("mousemove",mouveHandle);
    }

    let mouveHandle=function(event){
        tracker.update(nd.position(),{x:event.pageX,y:event.pageY});
        document.body.addEventListener("mousedown",f,{once:true});
        
    };
    document.body.addEventListener("mousemove",mouveHandle);
}

class listLabel{
    constructor(graph){
        this.parentGraph=graph;
        this.html=document.getElementById("graph-list").content.firstElementChild.cloneNode(true);
        this.name_span=this.html.querySelector(".header> span");
        this.type_button=this.html.querySelector(".header > button")
        this.html.id=graph.id;
        this.html.style.setProperty("--graph-id",graph.id);
        this.hidden=false;

        this.name_span.textContent=" G"+graph.id;
        if(this.parentGraph.type=="Unordered")this.type_button.classList.add("fa-solid","fa-share-nodes");
        else this.type_button.classList.add("fa-solid","fa-arrows-to-circle");

        document.getElementById("info-area").appendChild(this.html);

        this.chain_menu=this.html.querySelector(".menu-info .menu.chain");
        this.chain_menu.header=this.chain_menu.querySelector(".header");
        this.chain_menu.info=this.chain_menu.querySelector(".menu-info");
       
        this.chain_menu.header.querySelector("button").addEventListener("click",(ev)=>{
            ev.stopPropagation(); ev.stopImmediatePropagation();
            toggleMenu(ev.target,ev);
            this.getChains();
        });
        this.html.querySelector(".header").addEventListener("dblclick",()=>{
            if(this.hidden)return;
            this.scrollIntoView();
            this.parentGraph.select();
        },false);

        this.html.querySelector(".display-settings .node-slider").addEventListener("input",(event)=>{
            let size=event.target.value;
            this.parentGraph.html.style.setProperty("--node-size",size+"px");
            this.parentGraph.nodeSize=size;
            this.parentGraph.updateAll();
        })
        this.html.querySelector(".display-settings .color").addEventListener("input",(event)=>{
            this.parentGraph.html.style.setProperty("--neon-color",event.target.value);
        })
        this.html.querySelector(".display-settings .spread-slider").addEventListener("input",(event)=>{
            this.parentGraph.html.style.setProperty("--spread-radius",event.target.value)
        })

        this.type_button.addEventListener("click",(ev)=>{
            ev.stopPropagation(); ev.stopImmediatePropagation();
            this.hidden=!this.hidden
            this.parentGraph.toggleHide(); 
            if(this.hidden){
                this.html.style.opacity="0.3";
                this.html.children[1].classList.remove("extend-max-height");
            }else{
                this.html.style.opacity="1.0";
            }
        },false);
    }

    scrollIntoView(){
        let pos=this.parentGraph.center();
        window.scroll({
            top: pos.y-window.innerHeight/2*zoomLevel,
            left: pos.x-window.innerWidth/2*zoomLevel,
            behavior: "smooth"
        })
    }

    getChains(){
        const [a,b]=this.chain_menu.header.querySelectorAll("input");
        let chains=this.parentGraph.chains(a.value,b.value); 
        this.chain_menu.info.textContent="";
        if(!chains){
            a.value=b.value="";
            alert("Input invalid");
            return;
        }
        
        this.chain_menu.header.querySelector("button").classList.toggle("chain-menu-play");
        
        this.chain_menu.info.appendChild(elementFromHtml(`<div style="background: inherit;">\
        <span>Count -${chains.length} </span>\
        <button style="position:absolute;  right:2px;"><i class="fa-solid fa-filter"></i></button> </div>`));
        
        
        for(const x of chains){
            let chain_div=elementFromHtml(`<div tabindex="-1">${x}<div>`);
            chain_div.onfocus=(ev)=>{
                selection.clear();
                ev.stopImmediatePropagation(); ev.stopPropagation();
                
                let nodes=ev.target.textContent.split(",");
                for(let i=0; i<nodes.length-1; i++){
                    selection.push(this.parentGraph.node(nodes[i]));
                    selection.push(this.parentGraph.edge(nodes[i],nodes[i+1]));
                }
                let last=nodes[nodes.length-1];
                if(nodes[0]!=last)selection.push(this.parentGraph.node(last));
                this,this.scrollIntoView();
                
            }
            chain_div.onfocusout=()=>selection.clear;
            this.chain_menu.info.appendChild(chain_div);
        }
    }

    update(){
        this.chain_menu.info.classList.remove("extend-max-height");
    }
}


class Graph{
    static count=0;
    constructor(input,input_type,graph_type){
        this.type=graph_type;
        this.nodes={};
        this.id=(++Graph.count);
        this.html=elementFromHtml(`<div id="g${this.id}" class="default" draggable="false"></div>`);
        
        this.nodeSize=parseFloat(getComputedStyle(document.getElementById("defaultInfo")).getPropertyValue("--node-size"));
        
        this.label=new listLabel(this);
        this.readImput(input,input_type);
        
        for(const i in this.nodes){
            this.nodes[i].position(
                window.scrollX+300+Math.random()*(window.innerWidth-300),
                window.scrollY+300+Math.random()*(window.innerHeight-300)
            );
        }
        document.getElementById("container").appendChild(this.html);
    }

    readImput(input,input_type){
        let m=input.split("\n").filter(x=>x!=='').map(x=>x.split(" ").filter(x=>x!==''));
        if(input_type=="Matrix"){
            if(!m.length)return 0;
            let size_check=m[0].length;
            for(let i=0; i<m.length; i++)this.nodes[i+1]=new Node(i+1,this);
            for(let i=0; i<m.length; i++){
                if(m[i].length!=size_check){
                    alert("Input is not a matrix"); 
                    return 0;
                }
               
                for(let j=0; j<m[i].length; j++){
                    if(m[i][j]!=0)this.addEdge(i+1,j+1);
                }
            }
        }else if(input_type==""){
        }else if(input_type=="Nr. of nodes & list of edges"){
            let n=parseInt(m[0][0]);
            if(!n){
                alert("Nr. of nodes is invalid");
                return 0;
            }
            for(let i=1; i<=n; i++)this.nodes[i]=new Node(i,this); 
            for(let i=1; i<m.length; i++){
                let x=parseInt(m[i][0]);
                let y=parseInt(m[i][1]);
                if(!x||!y){
                    alert("Input nodes are not numbers");
                    return 0;
                }
                this.addEdge(x,y);
            }
        }
    }


    updateEdge(id){
        if(!this.node(id))return;
        for(const key in this.nodes[id].list)this.nodes[id].list[key].updateLine();
        for(const key in this.nodes)this.nodes[key].list[id]?.updateLine();
    }

    updateAll(){
        for(const key in this.nodes)
            for(const key1 in this.nodes[key].list)this.nodes[key].list[key1].updateLine();
    }

    removeNode(node){
        if(node.name=="Number"){
            this.nodes[node]?.delete();
        }else if(node.name=="Node")node.delete();
    }

    addNode(){
        let index=1;
        for(const x in this.nodes){
            if(parseInt(x)!=index)break;
            index++;
        }this.label.update();
        return this.nodes[index]=new Node(index,this);
    }

    addEdge(i1,i2){
        if(!this.node(i1)||!this.node(i2)||this.edge(i1,i2)||i1==i2)return;
        let ed=new Edge(i1,i2,this);
        this.nodes[i1].list[i2]=ed;
        if(this.type=="Unordered")this.nodes[i2].list[i1]=ed;
        this.label.update();
        return ed;
    }

    removeEdge(i1,i2){
        if(!this.edge(i1,i2))return;
        this.nodes[i1].list[i2].delete();
    }

    edge(i1,i2){
        return this.nodes[i1]?.list[i2];
    }

    node(i){
        return this.nodes[i];
    }

    delete(){
        document.getElementById("container").removeChild(this.html);
        document.getElementById("info-area").removeChild(this.label.html);
        delete graphs[this.id];
    }

    name(name){
        if(!name)return this.label.name_span.textContent;
        this.label.name_span.textContent=name;
        return name;
    }

    toggleHide(force){
        this.html.classList.toggle("hide",force);
    }

    chains(n1,n2){
        if(!this.node(n1)||!this.node(n2))return undefined;
        let sol=[],rez=[],fr=new Array(this.nodeCount()+1),isSol;
        fr.fill(0);
        if(n1==n2){
            isSol=(node)=>{
                if(fr[node]!=2||sol.length<2)return false;
                if(node==n2)return true;
                return false;
            }
        }else isSol=(node)=>{return fr[node]==1&&node==n2};

        let dfs=(node)=>{
            sol.push(node); fr[node]++;
            if(isSol(node)){
                rez.push(Array.from(sol));
                return;
            }
            if(fr[node]>1)return; 

            for(const x in this.nodes[node].list){
                dfs(parseInt(x));
                sol.pop(); fr[parseInt(x)]--;
            }
        }
        dfs(n1);
        return rez; 
    }

    center(){
        let rez={x:0,y:0},n=this.nodeCount();
        for(const key in this.nodes){
            let pos=this.nodes[key].position();
            rez.x+=pos.x; rez.y+=pos.y;
        }
        rez.x/=n; rez.y/=n;
        return rez;
    }

    getLastID(){
        let a=Object.keys(this.nodes);
        return parseInt(a[a.length-1]);
    }

    edgeCount(){
        let rez=0;
        for(const key in this.nodes)
            rez+=Object.keys(this.nodes[key]).length;
    }

    nodeCount(){
        return Object.keys(this.nodes).length;
    }

    grade(id,out){
        if(!this.node(id))return;
        if(out){
            let rez=0;
            for(const key in this.nodes)
                if(this.nodes[key].list[id])rez++;
        }
        return Object.keys(this.node(id).list);
    }
    
    select(){
        for(const key in this.nodes) selection.push(this.nodes[key]);
        
    }
}


class Edge{
    constructor(i1,i2,parent){
        this.parent=i1;
        this.son=i2;
        this.parentGraph=parent;
        this.tracker=new Tracker();
        this.html=this.tracker.html;
        
        this.arrow=elementFromHtml(`<i class="fa-solid fa-play" style="color: var(--background); font-size:inherit;" draggable="false"></i>`);
        if(this.parentGraph.type=="Ordered")this.html.appendChild(this.arrow);
        
        this.html.addEventListener("mouseover",(event)=>{
            let timer,el,r=this.parentGraph.nodeSize;
            let move=(ev)=>{
                if(timer)clearTimeout(timer);
                if(el)el.style.display="hidden";
                timer=setTimeout(()=>{
                    let offset={x:random(-r,0),y:random(-r,0)};
                    if(!el)
                        this.parentGraph.html.appendChild(
                            el=elementFromHtml(`<div style="z-index:900; transform:translate(-100%,-100%); position:absolute; paddin: 5px; border: 1px double var(--neon-color); color: var(--background)"></div>`)
                        );
                    el.style.cssText+=`display: flex; opacity:1; width:max-content; left: ${ev.pageX+offset.x}px; top: ${ev.pageY+offset.y}px;`;
                    el.textContent=this.parentGraph.name()+ "  :  "+this.parent+"  -  "+this.son;
                    el.animate([{opacity: 0},{opacity:1}],200);
                },1000);   
            }
            this.html.addEventListener("mousemove",move);
            this.html.addEventListener("mouseout",()=>{
                clearTimeout(timer);
                if(el){
                    el.getAnimations().forEach((x)=>x.cancel())
                    this.parentGraph.html.removeChild(el);
                    el=undefined;
                }
                this.html.removeEventListener("mousemove",move);
            },{once:true});
        })


        this.html.addEventListener("contextmenu",(ev)=>{
            ev.preventDefault();
            selection.push(this);
            return false;
        })
        
        
        this.updateLine();
        this.parentGraph.html.appendChild(this.html);
    }

    updateLine(){
        let i1=this.parentGraph.node(this.parent);
        let i2=this.parentGraph.node(this.son);
        let r=this.parentGraph.nodeSize/2;
        this.tracker.distance_offset=2*r;
        this.tracker.offset={x:r,y:r};
        let info=this.tracker.update(i1.position(),i2.position());

        if(info.length<3)this.arrow.classList.add("hide");
        else this.arrow.classList.remove("hide");
       
    }

    delete(){
        if(!this.parentGraph.edge(this.parent,this.son))return;
        this.parentGraph.html.removeChild(this.html);
        delete this.parentGraph.node(this.parent).list[this.son];
        if(this.parentGraph.type=="Unordered")
        delete this.parentGraph.node(this.son).list[this.parent];
    }
}



class Node{
    constructor(id,parent){
        this.parentGraph=parent;
        this.id=id;
        this.pos={x:0,y:0};
        this.list={};
        
        this.html=elementFromHtml(`<div class="node neon" contenteditable="false">${id}</div>`);
        
        
        this.html.ondragstart=function(){return false};
        
        let tracker=new Tracker();
        this.html.addEventListener("mousedown",(ev)=>{
            let p=this.position(),r=this.parentGraph.nodeSize/2;
            let lastPos={x:ev.pageX,y:ev.pageY},delta={x:0,y:0}; 
            tracker.distance_offset=2*r;
            tracker.offset={x:r,y:r};
            ev.preventDefault();
            
            let ontrackEnd=(e)=>{
                e.preventDefault(); e.stopImmediatePropagation();
                
                this.parentGraph.html.removeChild(tracker.html);
                
                if(e.target.classList[0]=="node"){
                    this.parentGraph.addEdge(this.id,parseInt(e.target.textContent));
                    selection.clear();
                }else{
                    let i=this.parentGraph.addNode();
                    this.parentGraph.addEdge(this.id,i.id); 
                    i.position(e.pageX-r,e.pageY-r);
                }
                return false;
            };
            let mouseMove=(event)=>{
                
                event.stopImmediatePropagation(); event.stopPropagation();
                p=this.position();
                delta={
                    x: event.pageX-lastPos.x,
                    y: event.pageY-lastPos.y
                };
                
                if(ev.which==1)this.position(delta.x+p.x,delta.y+p.y);
                else if(ev.which==2){
                    this.parentGraph.html.style.visibility="hidden";
                    for(const nd of selection.nodes){
                        let p=nd.position();
                        nd.position(delta.x+p.x,delta.y+p.y);
                    }
                    this.parentGraph.html.style.visibility="visible";
                }else if(ev.which==3){ 
                    this.parentGraph.html.appendChild(tracker.html);
                    tracker.update(this.position(),{x:event.pageX-r,y:event.pageY-r});
                    document.addEventListener("contextmenu",ontrackEnd,{once: true});
                }
                lastPos={x:event.pageX,y:event.pageY};
            }
            document.addEventListener("mousemove",mouseMove,false);
            document.addEventListener("mouseup",(e)=>{
                document.removeEventListener("mousemove",mouseMove);
               
            }, {once:true});
        },false);

        this.html.addEventListener("mouseover",(event)=>{
            let timer,el,r=this.parentGraph.nodeSize;
            let move=(ev)=>{
                if(timer)clearTimeout(timer);
                if(el)el.style.display="hidden";
                timer=setTimeout(()=>{
                    let offset={x:random(-r,0),y:random(-r,0)};
                    if(!el)
                        this.parentGraph.html.appendChild(
                            el=elementFromHtml(`<div style="z-index:900; transform: translate(-100%,-100%);  position:absolute; paddin: 5px; border: 1px double var(--neon-color); color: var(--background)"></div>`)
                        );
                    el.style.cssText+=`display: flex; opacity:1; width:max-content; left: ${ev.pageX+offset.x}px; top: ${ev.pageY+offset.y}px;`;
                    el.textContent=this.parentGraph.name()+ "  :  "+this.id;
                    el.animate([{opacity: 0},{opacity:1}],200);
                },1000);   
            }
            this.html.addEventListener("mousemove",move);
            this.html.addEventListener("mouseout",()=>{
                clearTimeout(timer);
                if(el){
                    el.getAnimations().forEach((x)=>x.cancel())
                    this.parentGraph.html.removeChild(el);
                    el=undefined;
                }
                this.html.removeEventListener("mousemove",move);
            },{once:true});
        })
        this.html.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            selection.push(this);
            return false;
        })
        this.parentGraph.html.appendChild(this.html);
    }
    position(x,y){ 
        if(x&&y){
            let r=this.parentGraph.nodeSize/2;
            this.pos={x:x,y:y};
            this.html.style.cssText+=`; left: ${this.pos.x}px; top: ${this.pos.y}px`;
            this.parentGraph.updateEdge(this.id);
        }
        return this.pos;
    }
    
    delete(){
        if(!this.parentGraph.node(this.id))return;
        this.parentGraph.html.removeChild(this.html);

       for(const key in this.list)this.list[key].delete();

        for(const [key,value] of Object.entries(this.parentGraph.nodes))
            value.list[this.id]?.delete();
        
        delete this.parentGraph.nodes[this.id];
        if(this.parentGraph.nodeCount()==0)this.parentGraph.delete();
    }
}



function matrixFromGraph(graph){
    let n=graph.getLastID(),s="";
    for(let i=1; i<=n; i++){
        for(let j=1; j<=n; j++)s+= (graph.edge(i,j))? "1 ":"0 ";
        s+="\n";
    }
    console.log(s);
    return s;
}

function adjacencyListFromGraph(graph){
    let s="";
    for(const x in graph.nodes)
        s+=Object.keys(graph.nodes[x].list)+"\n";
    return s;
}

function edgeListFromGraph(graph){
    let n=graph.getLastID(),s=n+"\n";
    for(const key in graph.nodes){
        for(const k in graph.nodes[key])s+=`${key} ${k}\n`
    }
    return s;
}

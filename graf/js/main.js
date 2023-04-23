var graphs={},Xaxis,Yaxis;


document.body.onload=()=>{
    let n=new Graph("0 1 1 1 1 2 2 2 2 3 3 3 3 4 4 4 4","Parent array","Ordered");
    graphs[n.id]=n;
    //n.label.processID("Chain");

    document.addEventListener("keydown",(ev)=>{
        if(ev.key==="f"&&ev.ctrlKey)toggleFullScreen();

    },false);
    let el=document.querySelector(".overview .header");
    addCustomDrag(el,{
        onstart: (ev)=>ev.which==1,
        onmove: (ev,delta)=>el.scrollBy(-delta.x,-delta.y),
    })

    
    Xaxis=new numberLine(document.body,{
        class1: "bottom-line",
        class2: "line-number",
        unit: "100px",
        direction: "row",
        slideTarget: window
    });
    Yaxis=new numberLine(document.body,{
        class1: "right-line",
        class2: "line-number",
        unit: "100px",
        direction: "column",
        slideTarget: window
    });
    
    addCustomDrag(window,{
        onstart: (ev)=>{
            if(ev.which!=3){
                return true;
            }
        },
        onmove: (ev,delta)=>{
            if(ev.target.id!="line")return;
            let rect=line.getBoundingClientRect();
            let dx=rect.width -delta.x;
            let dy=rect.height-delta.y;

            line.style.cssText+=`width: ${dx}px; height: ${dy}px`;
            window.scroll(dx-window.innerWidth,dy-window.innerHeight);
        }
    })
    let timer=null;
    let onscrollend=function(e){
        if(timer)clearTimeout(timer);
        timer=setTimeout(()=>{
            let el=document.documentElement;
            line.style.cssText+=`width: ${el.scrollLeft+window.innerWidth}px; height: ${el.scrollTop+window.innerHeight}px;`
        },250);
    }
    window.addEventListener("scroll",onscrollend,false);
}


function createGraph(){
    let graph_type=document.querySelector("input[name='graph-type']:checked").value;
    let input_type=document.querySelector(".input-info select");
    input_type=input_type.options[input_type.selectedIndex].text;
    let input=document.querySelector(".input-info textarea");
    document.querySelector(".new-graph>input").click();

    if(input.value==="")input.value='1';
    let NEW=new Graph(input.value,input_type,graph_type);
    graphs[NEW.id]=NEW;
    input.value="";
}


document.addEventListener("wheel",(ev)=>{ 
    if(ev.altKey){
        ev.preventDefault();
        if(selection.nodes.size==0)return;

        let fact=ev.deltaY*30,[pg]=selection.nodes,p,dir,mag;
        pg=pg.parentGraph;
        let r=pg.nodeSize;
        
        pg.toggleHide();
        for(const nd of selection.nodes){
            p=nd.position();
            dir={
                x: ev.pageX-p.x,
                y: ev.pageY-p.y
            }
            mag=Math.sqrt(dir.x**2+dir.y**2);
            if(mag<r)continue;
            dir.x/=mag; dir.y/=mag;
            dir.x*=fact; dir.y*=fact;

            nd.position(p.x-dir.x,p.y-dir.y);
        }
        pg.toggleHide();

    }
},{passive: false})
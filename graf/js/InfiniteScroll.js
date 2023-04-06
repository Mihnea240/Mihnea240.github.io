

window.addEventListener("mousedown",(event)=>{ 
    if(document.getElementById("main-display").contains(event.target))return;
    event.stopPropagation(); event.stopImmediatePropagation();
    
    let pos={x:event.clientX,y:event.clientY},line=document.getElementById("line");
    
    let moveHandle=function(ev){  
        ev.stopPropagation(); ev.stopImmediatePropagation();
        let rect=line.getBoundingClientRect();
        let dx=rect.width -ev.movementX;  pos.x=ev.clientX;
        let dy=rect.height-ev.movementY;  pos.y=ev.clientY;
        
        line.style.width=dx+"px";   line.style.height=dy+"px";
        window.scroll(dx-window.innerWidth,dy-window.innerHeight);
    }
    
    if(event.which!=3){
        window.addEventListener("mousemove",moveHandle,false);
        event.preventDefault();
    }
    window.addEventListener("mouseup",(e)=>{
        window.removeEventListener("mousemove",moveHandle);
    },{once:true});
    
});


let timer=null;
let f=function(e){
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>{
        let el=document.documentElement;
        line.style.width=el.scrollLeft+window.innerWidth+"px";
        line.style.height=el.scrollTop+window.innerHeight+"px";
    },250);
}
window.addEventListener("scroll",f,false);


let zoomLevel=1,container=document.getElementById("container");
let or={x:0,y:0},pos={x:0,y:0};
document.addEventListener("wheel",(ev)=>{ 
    if(ev.altKey){
        ev.preventDefault();
       
        /*
        let fact=0.05;
        zoomLevel+=fact*ev.deltaY;
        if(zoomLevel>5)zoomLevel=5;
        if(zoomLevel<=0.05)zoomLevel=0.05;

        let d=1/zoomLevel;

        pos.x+=(ev.pageX)*(d-1)-pos.x;
        pos.y+=(ev.pageY)*(d-1)-pos.y;

        container.style.cssText+=`zoom: ${zoomLevel}; left: ${pos.x}px; top: ${pos.y}px;`;*/
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
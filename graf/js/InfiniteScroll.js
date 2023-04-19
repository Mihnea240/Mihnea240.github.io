



window.addEventListener("mousedown",(event)=>{ 
    //if(document.getElementById("main-display").contains(event.target))return;
    if(event.target.id!="line")return;
    event.stopPropagation(); event.stopImmediatePropagation();
    
    let pos={x:event.clientX,y:event.clientY},line=document.getElementById("line");
    
    let moveHandle=function(ev){  
        ev.stopPropagation(); ev.stopImmediatePropagation();
        let rect=line.getBoundingClientRect();
        let dx=rect.width -(ev.clientX-pos.x);  pos.x=ev.clientX;
        let dy=rect.height-(ev.clientY-pos.y);  pos.y=ev.clientY;
        
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
        line.style.cssText+=`width: ${el.scrollLeft+window.innerWidth}px; height: ${el.scrollTop+window.innerHeight}px;`
    },250);
}
window.addEventListener("scroll",f,false);



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
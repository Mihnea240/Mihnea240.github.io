

window.addEventListener("mousedown",(event)=>{ 
    
    let pos={x:event.clientX,y:event.clientY},line=document.getElementById("line");
    
    let moveHandle=function(ev){  
        let rect=line.getBoundingClientRect();
        let dx=rect.width -ev.movementX;  pos.x=ev.clientX;
        let dy=rect.height-ev.movementY;  pos.y=ev.clientY;
        
        line.style.width=dx+"px";   line.style.height=dy+"px";
        window.scroll(dx-window.innerWidth,dy-window.innerHeight);
    }
    
    if(event.which==2){
        event.preventDefault();
        window.addEventListener("mousemove",moveHandle);
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

var graphs={},scrollLevel=1;

function elementFromHtml(html){
    const template=document.createElement("template");
    template.innerHTML=html.trim();
    return template.content.firstElementChild;
}

function random(min,max){
    return min+Math.random()*(max-min);
}


function slide(inout){
    document.getElementById("main-display").classList.toggle("slide-in",inout);
}

function checkBox(el){
    let f=(ev)=>{
        //ev.stopPropagation(); ev.stopImmediatePropagation();
        if(el.parentNode.contains(ev.target))return;
        document.removeEventListener("click",f);
        el.checked=false;
        
    }
    if(el.checked==true){
        document.addEventListener("click",f);
    }else document.removeEventListener("click",f);
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

function copyGraph(id){
    let input=matrixFromGraph(graphs[id]);
    let type=graphs[id].type;
    let n=new Graph(input,"Matrix",type);
    graphs[n.id]=n;
    n.label.name_span.textContent="Copy of-"+graphs[id].label.name_span.textContent;
    document.getElementById("info-area")
        .insertBefore(n.label.html,document.getElementById(id).nextSibling);
}



document.body.onload=()=>{
    let n=new Graph("0 1 1 1\n1 0 1 1\n1 1 0 1\n1 1 1 0","Matrix","Ordered");
    graphs[n.id]=n;
    document.body.style.zoom="100%";

    document.addEventListener("keydown",(ev)=>{
        if(ev.key==="Enter")toggleFullScreen();
        
    },false);
}
function toggleFullScreen(){
    if(!document.fullscreenElement)document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

function toggleMenu(el,event,force=undefined){
    if(event&&event.target!=el)return;
    let x=el.parentNode;
    while(!x.classList.contains("menu"))x=x.parentNode;
    x.querySelector(".menu-info").classList.toggle("extend-max-height",force);
}

class Tracker{
    constructor(){
        this.html=elementFromHtml(`<div class="edge neon"></div>`);
        this.offset={x:0,y:0};
        this.distance_offset=0; 
        this.Rad2Deg=180/Math.PI;
    }
    update(a,b){
        let angle=Math.atan2(b.y-a.y,b.x-a.x)* this.Rad2Deg;
        let distance=Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y))-this.distance_offset;
        let pos={
            x:(a.x+b.x)/2-distance/2+this.offset.x,
            y:(a.y+b.y)/2+this.offset.y
        };
        this.html.style= 
        `width: ${distance}px; left:${pos.x}px; top:${pos.y}px; transform: rotate(${angle}deg);`;
        return {x: pos.x,y:pos.y,length:distance,rotation:angle};
    }
}

class toolTip{
    constructor(el){
        this.html=el;
    }
    show({x,y},{ox=0,oy=0}){
        this.el.style.cssText+=`position: absolute; left: ${x+ox}; top: ${y+oy};`
        this.el.classList.add("hide");
    }
    hide(){
        this.el.style.classList.add("hide");
    }
}

var generalToolTip=new toolTip(elementFromHtml(`<div class="selection-menu"></div>`));
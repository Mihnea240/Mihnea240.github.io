
function elementFromHtml(html){
    const template=document.createElement("template");
    template.innerHTML=html.trim();
    return template.content.firstElementChild;
}

function random(min,max){
    return min+Math.random()*(max-min);
}

function toggleFullScreen(){
    if(!document.fullscreenElement)document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

Array.prototype.back=function(steps=1){
    return this.at(this.length-steps);
}

function getMatrix(n,m,val=0){
    return new Array(n).fill(val).map(el=>el=new Array(m).fill(val));
}

function matrixToString(mat,x1=0,x2=0,y1=mat.length,y2=mat[0].length){
    let str='' ,el;
    for(let i=x1; i<y1; i++){
        for(let j=x2; j<y2; j++)str+=mat[i][j]+' ';
        str+='\n';
    }
    return str;
}

function addCustomDrag(target,{onstart=(ev,delta)=>true,onmove=onstart,onend=onstart}){
    let pos={x:0,y:0},delta=pos;
    let moveHandle=(ev)=>{
        delta={x: ev.clientX-pos.x, y: ev.clientY-pos.y};
        pos={x: ev.clientX, y: ev.clientY};
        onmove(ev,delta);
    }
    target.addEventListener("mousedown",(ev)=>{
        pos={x: ev.clientX, y: ev.clientY};
        
        if(!onstart(ev))return;
        document.addEventListener("mousemove",moveHandle);
        document.addEventListener("mouseup",(ev)=>{
            if(onend(ev))document.removeEventListener("mousemove",moveHandle);
        },{once:true});
        
    })
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

function slide(inout){
    document.getElementById("main-display").classList.toggle("slide-in",inout);
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

function toggleMenu(el,event,force=undefined){
    if(event&&event.target!=el)return;
    let x=el.parentNode;
    while(!x.classList.contains("menu"))x=x.parentNode;
    x.querySelector(".menu-info").classList.toggle("extend-max-height",force);
}

function resize(el,ev){
    ev.preventDefault();
    if(ev.clientX)el.style.width=ev.clientX*100/window.innerWidth+"vw";
    return false;
}

function restrictInput(ev){
    let last=ev.key.charCodeAt(0);
    if(ev.target.textContent.length>10 || last<48 || last>58)ev.preventDefault();
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
    show({x,y},message,{ox,oy}={ox: 0, oy: 0}){
        this.html.style.cssText+=`position: absolute; left: ${x+ox}; top: ${y+oy}; content: ${message}`
        this.html.classList.remove("hide");
    }
    hide(){
        this.el.style.classList.add("hide");
    }
}
var generalToolTip=new toolTip(elementFromHtml(`<div class="selection-menu"></div>`));


class numberLine{
    constructor(elem,{class1='',class2='',unit,direction,slideTarget=elem,onclick}){
        this.target=elem;
        this.direction=direction;
        this.slideTarget=slideTarget;
        this.onclick=onclick;

        this.html=elementFromHtml(`<div class="${class1}" style="display: flex; flex-direction:${direction}; justify-content:flex-start; align-items: flex-start; gap: ${unit}; overflow: hidden;"></div>`);
        this.list=[elementFromHtml(`<span class="${class2}" style="max${this.direction=="row"?"-width":"-height"}: 0px;">0</span>`)];

        this.observer=new ResizeObserver(entry=>this.fitElements());
        this.observer.observe(this.html);

        elem.appendChild(this.html);
        this.html.appendChild(this.list[0]);
        this.unit=unit;
        this.html.addEventListener("click",onclick,false);

        this.fitElements();

        this.slideTarget.addEventListener("scroll",(ev)=>{
            let gap=parseFloat(getComputedStyle(this.html).gap);

            this.html.classList.toggle("hide");
            let scroll_pos;
            if(this.slideTarget==window)scroll_pos=this.slideTarget[this.direction=="row"?"scrollX":"scrollY"];
            else scroll_pos=this.slideTarget[this.direction=="row"?"scrollLeft":"scrollTop"];
            
            let scroll_to_units=scroll_pos/gap;
            
            let offset=scroll_to_units-parseInt(this.list[0].textContent);
            
            let offsetX=(offset-Math.round(offset))*(this.direction=="row")*(gap-1);
            let offsetY=(offset-Math.round(offset))*(this.direction=="column")*(gap-1);
            this.html.style.cssText+=`transform: translate(${-offsetX}px,${-offsetY}px)`
            
            this.list.forEach(el=>el.textContent=Math.round(parseInt(el.textContent)+offset));
            
            this.html.classList.toggle("hide");
        })
    }

    set unit(val){
        this.html.style.gap=val;
        this.fitElements();
    }

    fitElements(){
        let style=getComputedStyle(this.html);
        let size=parseFloat(this.direction=="row"?style.width:style.height);
        let spacing=parseFloat(style.gap);
        
        let last=this.list.back().getBoundingClientRect()[this.direction=="row"?"left":"top"]
        last-=this.html.getBoundingClientRect()[this.direction=="row"?"left":"top"];
        
        this.html.classList.toggle("hide");
        /*while(last>size&&last.size>=1){
            last-=spacing;
            this.html.removeChild(this.list.back());
            this.list.splice(-1);
        }*/
        while(last+spacing<size){
            last+=spacing;
            let el=this.list[0].cloneNode(true);
            el.textContent=parseFloat(this.list.back().textContent)+1;
            this.list.push(el);
            this.html.appendChild(el);
        }
        this.html.classList.toggle("hide");
    }

    
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random(0,i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function elementFromHtml(html){
    const template=document.createElement("template");
    template.innerHTML=html.trim();
    return template.content.firstElementChild;
}

function addCustomDrag(target,{onstart=(ev,delta)=>true,onmove=(ev,delta)=>true,onend=ev=>true}){
    let pos={x:0,y:0},delta=pos;
    let moveHandle=(ev)=>{
        delta={x: ev.clientX-pos.x, y: ev.clientY-pos.y};
        pos = { x: ev.clientX, y: ev.clientY };
        onmove(ev,delta);
    }
    target.addEventListener("mousedown",(ev)=>{
        pos={x: ev.clientX, y: ev.clientY};
        
        if(!onstart(ev))return;
        document.addEventListener("mousemove",moveHandle);
        document.addEventListener("mouseup",(ev)=>{
            onend(ev);
            document.removeEventListener("mousemove", moveHandle);
        },{once:true});
        
    },false)
}

function random(min,max){
    return min+Math.random()*(max-min);
}

function toggleFullScreen(){
    if(!document.fullscreenElement)document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

Array.prototype.back=function(steps=0){
    return this.at(this.length-steps-1);
}

function contentEdit(el, {maxSize=0,minSize=0,empty = "",pattern=new RegExp()}) {
    el.addEventListener("keydown", (ev) => {
        let len = el.textContent.length, add = 0, remove = 0;
        switch (ev.key) {
            case "Enter": {
                el.blur();
                ev.preventDefault();
                if (len - remove == 0) el.textContent = empty;
                return;
            }
            case "ArrowLeft": case "ArrowRight": return;
            case "Delete": case "Backspace": remove = 1; break;
            default: add = 1;
        }
        
        
        if (len + add > maxSize || len - remove < minSize) ev.preventDefault(); 
    })
    el.oninput = (ev) => el.textContent= el.textContent.replace(pattern, "");
    el.addEventListener("blur", (ev) => {
        el.setAttribute("contenteditable", false);
    })
    return el;
}

Math.rad2Deg = 57.2957795;

class Point{
    constructor(x=0,y=0) {
        this.x = x; this.y = y;
    }
    set(x, y) {
        this.x = x; this.y = y;
        return this;
    }
    translate(x=0,y=0) {
        this.x += x; this.y += y;
        return this;
    }
    dist() { return Math.sqrt(this.x * this.x + this.y * this.y)}
    distSq() { return (this.x * this.x + this.y * this.y) }
    multiplyScalar(val) {
        this.x *= val; this.y *= val;
        return this;
    }
    normalize() {
        this.multiplyScalar(1 / this.dist());
        return this;
    }

}

function createMatrix(n, m) {
    let rez = new Array(n);
    for (let i = 0; i < n; i++)
        rez[i] = new Array(m).fill(0);
    return rez;
}
var graphs={},Xaxis,Yaxis;


document.body.onload=()=>{
    let n=new Graph("2 3 0 5 2 4 1 9 3 1 9 11","Parent array","Ordered");
    graphs[n.id]=n;
    document.body.style.zoom="100%";

    document.addEventListener("keydown",(ev)=>{
        if(ev.key==="f"&&ev.ctrlKey)toggleFullScreen();
        
    },false);

    let el= document.querySelector(".overview .header");
    el.addEventListener("mousemove",(ev)=>{
        ev.stopImmediatePropagation(); ev.stopPropagation();
        if(ev.which!=1)return;
        el.scrollBy(-ev.movementX,-ev.movementY);
    });

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
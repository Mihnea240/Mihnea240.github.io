function AABB(rect1,rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}


function visibleElements(graph) {
    let viewRect = graph.tab.viewRect, rez = [];
    let p = new Point();
    let { top, left } = graph.tab.rect;
    let zoom = graph.settings.graph.zoom;
    let { scrollLeft, scrollTop } = graph.tab.tab;
    for (let el of graph.tab.children) {
        let rect = {};
        if (el.tagName == "GRAPH-NODE") {
            rect = {
                x: el.pos.x,
                y: el.pos.y,
                width: el.size.x,
                height: el.size.y,
            }
        } else if (el.tagName == "GRAPH-EDGE") {
            let r = el.getBoundingClientRect();
            console.log(zoom);
            p.set(r.x, r.y).translate(scrollLeft - left/zoom, scrollTop - top/zoom  );
            rect = {
                x: p.x,
                y: p.y,
                width: r.width,
                height: r.height
            }
            console.log(rect);
        } else continue;
        
        if (AABB(viewRect, rect)) rez.push([el, rect]);
    }
    return rez;
}
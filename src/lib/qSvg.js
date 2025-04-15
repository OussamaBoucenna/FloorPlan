// src/utils/roomDetection.js
import {junctionList,rayCasting,vertexList,segmentTree,areaRoom,arrayCompare,polygonIntoWalls,area,} from "./helper"
export function polygonize(WALLS) {
  // Step 1: Create junction and vertex lists from walls
  const junction = junctionList(WALLS);
  const vertex = vertexList(junction, WALLS);
  const vertexCopy = JSON.parse(JSON.stringify(vertex));

  // Step 2: Build edge connections
  const edgesChild = [];
  for (let j = 0; j < vertex.length; j++) {
    for (let vv = 0; vv < vertex[j].child.length; vv++) {
      edgesChild.push([j, vertex[j].child[vv].id]);
    }
  }
  
  // Step 3: Find polygons/rooms
  const polygons = [];
  
  for (let jc = 0; jc < edgesChild.length; jc++) {
    // Find best starting vertex (leftmost with multiple connections)
    let bestVertex = 0;
    let bestVertexValue = Infinity;
    
    for (let j = 0; j < vertex.length; j++) {
      if (vertex[j].x < bestVertexValue && vertex[j].child.length > 1 && vertex[j].bypass === 0) {
        bestVertexValue = vertex[j].x;
        bestVertex = j;
      }
      if (vertex[j].x === bestVertexValue && vertex[j].child.length > 1 && vertex[j].bypass === 0) {
        if (vertex[j].y > vertex[bestVertex].y) {
          bestVertexValue = vertex[j].x;
          bestVertex = j;
        }
      }
    }

    // Find possible paths from this vertex
    const WAYS = segmentTree(bestVertex, vertex);
    
    if (WAYS.length === 0) {
      vertex[bestVertex].bypass = 1;
    }
    
    if (WAYS.length > 0) {
      const tempSurface = WAYS[0].split('-');
      const lengthRoom = areaRoom(vertex, tempSurface);
      const bestArea = parseInt(lengthRoom);
      
      // Check if this polygon already exists
      let found = true;
      for (let sss = 0; sss < polygons.length; sss++) {
        if (arrayCompare(polygons[sss].way, tempSurface, 'pop')) {
          found = false;
          vertex[bestVertex].bypass = 1;
          break;
        }
      }

      // Skip too small areas
      if (bestArea < 360) {
        vertex[bestVertex].bypass = 1;
      }
      
      // Process valid polygon
      if (vertex[bestVertex].bypass === 0) {
        // Calculate real room coordinates considering wall thickness
        const realCoords = polygonIntoWalls(vertex, tempSurface, WALLS);
        const realArea = area(realCoords.inside);
        const outsideArea = area(realCoords.outside);
        
        // Create coordinate list
        const coords = [];
        for (let rr = 0; rr < tempSurface.length; rr++) {
          coords.push({x: vertex[tempSurface[rr]].x, y: vertex[tempSurface[rr]].y});
        }
        
        // Add polygon to the list
        if (realCoords.inside.length !== realCoords.outside.length) { // Fake room
          polygons.push({
            way: tempSurface, 
            coords: coords, 
            coordsOutside: realCoords.outside, 
            coordsInside: realCoords.inside, 
            area: realArea, 
            outsideArea: outsideArea, 
            realArea: bestArea
          });
        } else { // Real room
          polygons.push({
            way: tempSurface, 
            coords: realCoords.inside, 
            coordsOutside: realCoords.outside, 
            area: realArea, 
            outsideArea: outsideArea, 
            realArea: bestArea
          });
        }

        // Clean up connections - Remove first point connections
        for (let aa = 0; aa < vertex[bestVertex].child.length; aa++) {
          if (vertex[bestVertex].child[aa].id === parseInt(tempSurface[1])) {
            vertex[bestVertex].child.splice(aa, 1);
            break;
          }
        }

        // Remove connections from second vertex
        for (let aa = 0; aa < vertex[tempSurface[1]].child.length; aa++) {
          if (vertex[tempSurface[1]].child[aa].id === bestVertex) {
            vertex[tempSurface[1]].child.splice(aa, 1);
            break;
          }
        }
        
        // Remove vertices with single child (dangling)
        let looping;
        do {
          looping = 0;
          for (let aa = 0; aa < vertex.length; aa++) {
            if (vertex[aa].child.length === 1) {
              looping = 1;
              vertex[aa].child = [];
              for (let ab = 0; ab < vertex.length; ab++) {
                for (let ac = 0; ac < vertex[ab].child.length; ac++) {
                  if (vertex[ab].child[ac].id === aa) {
                    vertex[ab].child.splice(ac, 1);
                    break;
                  }
                }
              }
            }
          }
        } while (looping === 1);
      }
    }
  }
  
  // Step 4: Detect nested rooms
  for (let pp = 0; pp < polygons.length; pp++) {
    const inside = [];
    for (let free = 0; free < polygons.length; free++) {
      if (pp !== free) {
        const polygonFree = polygons[free].coords;
        const countCoords = polygonFree.length;
        let found = true;
        
        for (let pf = 0; pf < countCoords; pf++) {
          found = rayCasting(polygonFree[pf], polygons[pp].coords);
          if (!found) {
            break;
          }
        }
        
        if (found) {
          inside.push(free);
          polygons[pp].area = polygons[pp].area - polygons[free].outsideArea;
        }
      }
    }
    polygons[pp].inside = inside;
  }
  
  return { polygons, vertex };
}


export function angleDeg(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

export function vectorXY(obj1, obj2) {
  return ({
    x:  obj2.x - obj1.x,
    y:  obj2.y - obj1.y
  });
}

export function vectorDeter(v1, v2) {
  return (v1.x * v2.y)-(v1.y * v2.x);
}



export function middle(xo, yo, xd, yd) {
  var x1 = parseInt(xo);
  var y1 = parseInt(yo);
  var x2 = parseInt(xd);
  var y2 = parseInt(yd);
  var middleX = Math.abs(x1 + x2) / 2;
  var middleY = Math.abs(y1 + y2) / 2;
  return ({
      x: middleX,
      y: middleY
  });
}
export function createSVGElement(parent, tagName, attrs = {}) {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [key, val] of Object.entries(attrs)) {
    if (val !== undefined) {
      elem.setAttribute(key, val);
    }
  }

  if (parent && parent !== 'none') {
    const container = typeof parent === 'string' ? document.getElementById(parent) : parent;
    if (container) container.appendChild(elem);
  }

  return elem;
}

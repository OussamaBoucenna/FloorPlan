import { calculatePolygonArea } from './qSvg'; // Assuming you have a library for polygon area calculation
export function junctionList(WALLS) {
    const junctions = [];
    
    // Find all junctions (where walls connect)
    for (let i = 0; i < WALLS.length; i++) {
      const wall = WALLS[i];
      
      // Check start point for junctions
      let matchStart = false;
      for (let j = 0; j < junctions.length; j++) {
        if (almostEqual(junctions[j].x, wall.start.x, 1) && almostEqual(junctions[j].y, wall.start.y, 1)) {
          junctions[j].segment.push(i);
          matchStart = true;
          break;
        }
      }
      if (!matchStart) {
        junctions.push({
          x: wall.start.x,
          y: wall.start.y,
          segment: [i]
        });
      }
      
      // Check end point for junctions
      let matchEnd = false;
      for (let j = 0; j < junctions.length; j++) {
        if (almostEqual(junctions[j].x, wall.end.x, 1) && almostEqual(junctions[j].y, wall.end.y, 1)) {
          junctions[j].segment.push(i);
          matchEnd = true;
          break;
        }
      }
      if (!matchEnd) {
        junctions.push({
          x: wall.end.x,
          y: wall.end.y,
          segment: [i]
        });
      }
    }
    
    return junctions;
  }
  
  export function vertexList(junctions, WALLS) {
    const vertex = [];
    
    // Create vertices from junctions
    for (let i = 0; i < junctions.length; i++) {
      const junction = junctions[i];
      const vertexObj = {
        x: junction.x,
        y: junction.y,
        segment: junction.segment,
        links: [],
        child: [],
        bypass: 0
      };
      
      // Find all connections to this vertex
      for (let s = 0; s < junction.segment.length; s++) {
        const wallIndex = junction.segment[s];
        const wall = WALLS[wallIndex];
        
        // Each wall has two ends - find which one matches this junction
        if (almostEqual(wall.start.x, junction.x, 1) && almostEqual(wall.start.y, junction.y, 1)) {
          vertexObj.links.push({
            x: wall.end.x,
            y: wall.end.y,
            wallIndex: wallIndex
          });
        } else {
          vertexObj.links.push({
            x: wall.start.x,
            y: wall.start.y,
            wallIndex: wallIndex
          });
        }
      }
      
      vertex.push(vertexObj);
    }
    
    // Build child connections (graph edges)
    for (let i = 0; i < vertex.length; i++) {
      for (let j = 0; j < vertex[i].links.length; j++) {
        const link = vertex[i].links[j];
        
        // Find the vertex that matches this link
        for (let k = 0; k < vertex.length; k++) {
          if (k !== i && almostEqual(vertex[k].x, link.x, 1) && almostEqual(vertex[k].y, link.y, 1)) {
            vertex[i].child.push({
              id: k,
              wall: link.wallIndex
            });
            break;
          }
        }
      }
    }
    
    return vertex;
  }
  
  export function segmentTree(vertexIndex, vertexList) {
    // Find all closed paths (cycles) from this vertex
    const paths = [];
    
    // Helper function for depth-first search
    function findPaths(current, visited, path) {
      // Add current vertex to path
      path.push(current);
      visited[current] = true;
      
      // If we find a cycle back to the start, add it to paths
      if (path.length > 2 && current === vertexIndex) {
        paths.push(path.slice().join('-'));
        return;
      }
      
      // Explore children
      const vertex = vertexList[current];
      for (let i = 0; i < vertex.child.length; i++) {
        const childId = vertex.child[i].id;
        
        // Skip visited vertices (except the starting vertex for cycles)
        if (!visited[childId] || (childId === vertexIndex && path.length > 2)) {
          findPaths(childId, {...visited}, path.slice());
        }
      }
    }
    
    // Start DFS from the vertex
    findPaths(vertexIndex, {}, []);
    
    // Sort paths by length (prefer shorter cycles)
    paths.sort((a, b) => a.split('-').length - b.split('-').length);
    
    return paths;
  }
  
  export function areaRoom(vertex, coords, digit = 2) {
    const points = [];
    
    for (let i = 0; i < coords.length; i++) {
      points.push({
        x: vertex[coords[i]].x,
        y: vertex[coords[i]].y
      });
    }
    
    return calculatePolygonArea(coords, 100, false); 
  }
  
  export function area(coords) {
    // Calculate polygon area using shoelace formula
    let area = 0;
    
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].x * coords[j].y;
      area -= coords[j].x * coords[i].y;
    }
    
    return Math.abs(area / 2);
  }
  
  export function almostEqual(a, b, tolerance = 0.1) {
    return Math.abs(a - b) < tolerance;
  }
  
  export function polygonIntoWalls(vertex, surface, WALLS) {
    // This is your modified version of polygonIntoWalls that takes WALLS as parameter
    const vertexArray = surface;
    const wall = [];
    const polygon = [];
    
    for (let rr = 0; rr < vertexArray.length; rr++) {
      polygon.push({x: vertex[vertexArray[rr]].x, y: vertex[vertexArray[rr]].y});
    }
    
    // Find walls between vertices
    for (let i = 0; i < vertexArray.length-1; i++) {
      for (let segStart = 0; segStart < vertex[vertexArray[i+1]].segment.length; segStart++) {
        for (let segEnd = 0; segEnd < vertex[vertexArray[i]].segment.length; segEnd++) {
          if (vertex[vertexArray[i+1]].segment[segStart] === vertex[vertexArray[i]].segment[segEnd]) {
            wall.push({
              x1: vertex[vertexArray[i]].x, 
              y1: vertex[vertexArray[i]].y, 
              x2: vertex[vertexArray[i+1]].x, 
              y2: vertex[vertexArray[i+1]].y, 
              segment: vertex[vertexArray[i+1]].segment[segStart]
            });
          }
        }
      }
    }
    
    // Calculate intersections for inner and outer wall edges
    const inside = [];
    const outside = [];
    
    for (let i = 0; i < wall.length; i++) {
      const inter = [];
      const edge = wall[i];
      const nextEdge = i < wall.length - 1 ? wall[i+1] : wall[0];
      
      const angleEdge = Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1);
      const angleNextEdge = Math.atan2(nextEdge.y2 - nextEdge.y1, nextEdge.x2 - nextEdge.x1);
      
      const edgeThicknessX = (WALLS[edge.segment].thick/2) * Math.sin(angleEdge);
      const edgeThicknessY = (WALLS[edge.segment].thick/2) * Math.cos(angleEdge);
      const nextEdgeThicknessX = (WALLS[nextEdge.segment].thick/2) * Math.sin(angleNextEdge);
      const nextEdgeThicknessY = (WALLS[nextEdge.segment].thick/2) * Math.cos(angleNextEdge);
      
      const eqEdgeUp = createEquation(
        edge.x1 + edgeThicknessX, 
        edge.y1 - edgeThicknessY, 
        edge.x2 + edgeThicknessX, 
        edge.y2 - edgeThicknessY
      );
      
      const eqEdgeDw = createEquation(
        edge.x1 - edgeThicknessX, 
        edge.y1 + edgeThicknessY, 
        edge.x2 - edgeThicknessX, 
        edge.y2 + edgeThicknessY
      );
      
      const eqNextEdgeUp = createEquation(
        nextEdge.x1 + nextEdgeThicknessX, 
        nextEdge.y1 - nextEdgeThicknessY, 
        nextEdge.x2 + nextEdgeThicknessX, 
        nextEdge.y2 - nextEdgeThicknessY
      );
      
      const eqNextEdgeDw = createEquation(
        nextEdge.x1 - nextEdgeThicknessX, 
        nextEdge.y1 + nextEdgeThicknessY, 
        nextEdge.x2 - nextEdgeThicknessX, 
        nextEdge.y2 + nextEdgeThicknessY
      );
      
      // Convert to degrees
      const angleDegEdge = angleEdge * (180 / Math.PI);
      const angleDegNextEdge = angleNextEdge * (180 / Math.PI);
      
      if (eqEdgeUp.A !== eqNextEdgeUp.A) {
        inter.push(intersectionOfEquations(eqEdgeUp, eqNextEdgeUp));
        inter.push(intersectionOfEquations(eqEdgeDw, eqNextEdgeDw));
      } else {
        inter.push({
          x: edge.x2 + edgeThicknessX, 
          y: edge.y2 - edgeThicknessY
        });
        inter.push({
          x: edge.x2 - edgeThicknessX, 
          y: edge.y2 + edgeThicknessY
        });
      }
      
      for (let ii = 0; ii < inter.length; ii++) {
        if (rayCasting(inter[ii], polygon)) {
          inside.push(inter[ii]);
        } else {
          outside.push(inter[ii]);
        }
      }
    }
    
    // Close the polygons
    if (inside.length > 0) inside.push({...inside[0]});
    if (outside.length > 0) outside.push({...outside[0]});
    
    return {inside, outside};
  }
  
  export function rayCasting(point, polygon) {
    // Ray casting algorithm to determine if a point is inside a polygon
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) && 
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  export function createEquation(x1, y1, x2, y2) {
    // Create a line equation from two points
    if (Math.abs(x2 - x1) < 0.01) {
      // Vertical line
      return { A: 'v', B: x1 };
    }
    
    // Calculate slope (A) and y-intercept (B)
    const A = (y2 - y1) / (x2 - x1);
    const B = y1 - A * x1;
    
    return { A, B };
  }
  
  export function intersectionOfEquations(eq1, eq2) {
    // Find intersection point of two lines
    if (eq1.A === 'v' && eq2.A === 'v') {
      // Parallel vertical lines
      return null;
    }
    
    let x, y;
    
    if (eq1.A === 'v') {
      x = eq1.B;
      y = eq2.A * x + eq2.B;
    } else if (eq2.A === 'v') {
      x = eq2.B;
      y = eq1.A * x + eq1.B;
    } else {
      // Both are non-vertical lines
      if (Math.abs(eq1.A - eq2.A) < 0.01) {
        // Parallel lines
        return null;
      }
      
      x = (eq2.B - eq1.B) / (eq1.A - eq2.A);
      y = eq1.A * x + eq1.B;
    }
    
    return { x, y };
  }
  
  export function arrayCompare(arr1, arr2, app) {
    // Compare two arrays of vertices
    if (arr1.length !== arr2.length) return false;
    
    // Create copies to not modify originals
    const a1 = [...arr1];
    const a2 = [...arr2];
    
    // Trim last item if app is "pop"
    if (app === 'pop') {
      a1.pop();
      a2.pop();
    }
    
    // Check if arrays match in either order
    return (
      a1.every((val, i) => val === a2[i]) || 
      a1.every((val, i) => val === a2[a2.length - 1 - i])
    );
  }

    export const nearVertex=(walls,point,threshold)=>{
  // First create a list of all vertices from walls
  const vertices = [];
  
  // Extract all unique vertices from walls
  walls.forEach((wall, wallIndex) => {
    // Start point
    const startExists = vertices.findIndex(v => 
      Math.abs(v.x - wall.start.x) < 0.1 && 
      Math.abs(v.y - wall.start.y) < 0.1
    );
    
    if (startExists === -1) {
      vertices.push({
        x: wall.start.x,
        y: wall.start.y,
        walls: [{ wall, isStart: true, index: wallIndex }]
      });
    } else {
      vertices[startExists].walls.push({ wall, isStart: true, index: wallIndex });
    }
    
    // End point
    const endExists = vertices.findIndex(v => 
      Math.abs(v.x - wall.end.x) < 0.1 && 
      Math.abs(v.y - wall.end.y) < 0.1
    );
    
    if (endExists === -1) {
      vertices.push({
        x: wall.end.x,
        y: wall.end.y,
        walls: [{ wall, isStart: false, index: wallIndex }]
      });
    } else {
      vertices[endExists].walls.push({ wall, isStart: false, index: wallIndex });
    }
  });
  
  // Find vertices near the cursor point
  for (const vertex of vertices) {
    const distance = Math.sqrt(
      Math.pow(vertex.x - point.x, 2) + 
      Math.pow(vertex.y - point.y, 2)
    );
    
    // console.log(distance)
    if (distance < threshold) {
      return vertex;
    }
  }
  
  return null;
    }


// carpentryCalc.js - Generates paths for doors and windows
export const carpentryCalc = (classe, type, size, thick, value = 0) => {
  const meter = 60; // The scale factor used in original app
  let result = [];
  
  // Set default params - can be overridden per type
  let params = {
    bindBox: true,
    move: true,
    resize: true,
    rotate: true,
    resizeLimit: {
      width: { min: 40, max: 200 },
      height: { min: 5, max: 40 }
    }
  };
  
  if (classe === 'doorWindow') {
    const halfSize = size / 2;
    const halfThick = thick / 2;
    
    if (type === 'doorSingle') {
      // Door frame
      result.push({
        path: `M${-halfSize},${-halfThick} L${halfSize},${-halfThick} L${halfSize},${halfThick} L${-halfSize},${halfThick} Z`,
        fill: '#9fb2e2',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      // Door swing arc
      const radius = size * 0.9;
      result.push({
        path: `M${-halfSize},0 A${radius},${radius} 0 0,1 0,${radius}`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: '5,5',
        opacity: 0.6
      });
      
      // Door panel
      result.push({
        path: `M${-halfSize},0 L${-halfSize + size * 0.9},0`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      params.resizeLimit.width = { min: 40, max: 120 };
    }
    else if (type === 'doorDouble') {
      // Double door frame
      result.push({
        path: `M${-halfSize},${-halfThick} L${halfSize},${-halfThick} L${halfSize},${halfThick} L${-halfSize},${halfThick} Z`,
        fill: '#9fb2e2', 
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      // Left door swing
      const radius = size * 0.45;
      result.push({
        path: `M${-halfSize},0 A${radius},${radius} 0 0,1 ${-halfSize + radius},${radius}`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: '5,5',
        opacity: 0.6
      });
      
      // Right door swing
      result.push({
        path: `M${halfSize},0 A${radius},${radius} 0 0,0 ${halfSize - radius},${radius}`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: '5,5',
        opacity: 0.6
      });
      
      // Door panels
      result.push({
        path: `M${-halfSize},0 L${-1},0 M${1},0 L${halfSize},0`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      params.resizeLimit.width = { min: 60, max: 200 };
    }
    else if (type === 'windowSingle') {
      // Window frame
      result.push({
        path: `M${-halfSize},${-halfThick} L${halfSize},${-halfThick} L${halfSize},${halfThick} L${-halfSize},${halfThick} Z`,
        fill: '#ceecf0',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      // Window pane divider
      result.push({
        path: `M${-halfSize},0 L${halfSize},0`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      params.resizeLimit.width = { min: 30, max: 180 };
    }
    else if (type === 'windowDouble') {
      // Window frame
      result.push({
        path: `M${-halfSize},${-halfThick} L${halfSize},${-halfThick} L${halfSize},${halfThick} L${-halfSize},${halfThick} Z`,
        fill: '#ceecf0',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      // Window pane dividers
      result.push({
        path: `M${-halfSize},0 L${halfSize},0 M0,${-halfThick} L0,${halfThick}`,
        fill: 'none',
        stroke: '#333',
        strokeDashArray: 'none',
        opacity: 1
      });
      
      params.resizeLimit.width = { min: 50, max: 220 };
    }
  }
  
  // Add params to result
  result.params = params;
  
  return result;
};


export const calculatePolygonCentroid=(points)=>{
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    
    area += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }
  
  area = area / 2;
  
  // Handle very small or zero area (prevent division by zero)
  if (Math.abs(area) < 0.001) {
    // Fallback to simpler calculation for degenerate polygons
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    };
  }
  
  const factor = 1 / (6 * area);
  
  return {
    x: cx * factor,
    y: cy * factor
  };
}

export const calculateAspectRatio=(coords)=>{
  const xs = coords.map(p => p.x);
  const ys = coords.map(p => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return Math.max(width, height) / Math.min(width, height);
}
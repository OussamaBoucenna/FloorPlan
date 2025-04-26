import { vectorDeter, vectorXY } from "./qSvg";
import { utils } from "./utils";

// src/modules/walls.js
export const WALLS = []; // Store walls

// Helper functions
export function angleDeg(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}


// Detect if a point is near a wall
export const nearWall=(point, threshold = 10, walls = WALLS)=>{
  let minDist = Infinity;
  let nearestWall = null;
  let index;
  let nearestX = 0;
  let nearestY = 0;
  
  walls.forEach((wall,wallIndex) => {
    // Calculate distances
    const result = pointToLineDistance(point, wall.start, wall.end);
    
    if (result.distance < minDist && result.distance <= threshold) {
      minDist = result.distance;
      nearestWall = wall;
      nearestX = result.x;
      nearestY = result.y;
      index=wallIndex
    }
  });
  
  if (nearestWall) {
    return {
      wall: nearestWall,
      wallId:index,
      x: nearestX,
      y: nearestY,
      distance: minDist
    };
  }
  
  return false;
}

// Distance from point to line segment
export function pointToLineDistance(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return {
      distance: Math.sqrt(A * A + B * B),
      x: lineStart.x,
      y: lineStart.y
    };
  }
  
  let param = dot / lenSq;
  
  // Check if the closest point is outside the line segment
  if (param < 0) param = 0;
  else if (param > 1) param = 1;
  
  const x = lineStart.x + param * C;
  const y = lineStart.y + param * D;
  
  const dx = point.x - x;
  const dy = point.y - y;
  
  return {
    distance: Math.sqrt(dx * dx + dy * dy),
    x: x,
    y: y
  };
}

export const computeWallAngle = (wall,snapPoint)=>{
 let angle = angleDeg(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
  
 if (snapPoint) {
    const v1 = vectorXY(wall.start, wall.end);
    const v2 = vectorXY(wall.end, snapPoint);
    const angleSign = Math.sign(vectorDeter(v1, v2)) === 1 ? 1 : 0
    if (Math.sign(vectorDeter(v1, v2)) === 1) {
      angle += 180;
    }
    return {angle,angleSign};
  }
  
}



export const findWallAtPoint=(point,walls)=>{
  try {
    for (let i = 0; i < walls.length; i++) {
      if (isPointOnWall(point, walls[i], 10)) {
        return i;
      }
    }
    return null;
  } catch (error) {
    return null
  }
}

export const isPointOnWall = (point, wall, threshold = 10) => {
  // Implement point-to-wall distance check
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  const dot = ((point.x - wall.start.x) * dx + 
              (point.y - wall.start.y) * dy) / (length * length);
  
  const closestX = wall.start.x + dot * dx;
  const closestY = wall.start.y + dot * dy;
  
  const distance = Math.sqrt(
    (point.x - closestX) ** 2 + 
    (point.y - closestY) ** 2
  );
  
  return distance < threshold;
};

export const calculateWallPolygon = (start, end, thickness) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const normalAngle = angle + Math.PI/2;
  
  const dx = Math.cos(normalAngle) * thickness / 2;
  const dy = Math.sin(normalAngle) * thickness / 2;
  
  return [
    { x: start.x - dx, y: start.y - dy },
    { x: start.x + dx, y: start.y + dy },
    { x: end.x + dx, y: end.y + dy },
    { x: end.x - dx, y: end.y - dy }
  ];
};


export const nearWallNode = (walls,point, threshold = 20) => {
  let nearestNode = null;
  let minDistance = threshold;
  
  walls.forEach(wall => {
    // Check start point
    const distToStart = Math.sqrt(
      Math.pow(wall.start.x - point.x, 2) + 
      Math.pow(wall.start.y - point.y, 2)
    );
    
    if (distToStart < minDistance) {
      minDistance = distToStart;
      nearestNode = { ...wall.start, wall: wall };
    }
    
    // Check end point
    const distToEnd = Math.sqrt(
      Math.pow(wall.end.x - point.x, 2) + 
      Math.pow(wall.end.y - point.y, 2)
    );
    
    if (distToEnd < minDistance) {
      minDistance = distToEnd;
      nearestNode = { ...wall.end, wall: wall };
    }
  });
  
  return nearestNode;
};

// find connected Walls function 
export const findConnectedWalls = (walls,wallId) => {
  console.log("wall id jeune",wallId)
  const selectedWall = walls[wallId];
  const connections = [];
  
  // Check all other walls
  walls.forEach((wall, index) => {
    if (index === wallId) return; // Skip the selected wall
    if (Math.abs(wall.start.x - selectedWall.start.x) < 1 && 
        Math.abs(wall.start.y - selectedWall.start.y) < 1) {
      connections.push({
        wallId: index,
        point: 'start',  // Connects to selected wall's start
        connectedAt: 'start'  // Connects at its own start
      });
    }
    else if (Math.abs(wall.end.x - selectedWall.start.x) < 1 && 
             Math.abs(wall.end.y - selectedWall.start.y) < 1) {
      connections.push({
        wallId: index,
        point: 'start',  // Connects to selected wall's start
        connectedAt: 'end'  // Connects at its own end
      });
    }
    
    // Check if this wall connects to selected wall's end point
    if (Math.abs(wall.start.x - selectedWall.end.x) < 1 && 
        Math.abs(wall.start.y - selectedWall.end.y) < 1) {
      connections.push({
        wallId: index,
        point: 'end',  // Connects to selected wall's end
        connectedAt: 'start'  // Connects at its own start
      });
    }
    else if (Math.abs(wall.end.x - selectedWall.end.x) < 1 && 
             Math.abs(wall.end.y - selectedWall.end.y) < 1) {
      connections.push({
        wallId: index,
        point: 'end',  // Connects to selected wall's end
        connectedAt: 'end'  // Connects at its own end
      });
    }
  });
  
  return connections;
};


// Add this function to detect if a point is near an existing wall
export const isPointNearWall=(point, walls, threshold = 15)=> {
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    
    // Calculate perpendicular distance from point to wall line
    const line = {
      x1: wall.start.x,
      y1: wall.start.y,
      x2: wall.end.x,
      y2: wall.end.y
    };
    
    const distance = perpDistance(point, line);
  //  console.log("distance",distance)
   // console.log("threshold",isPointOnWallSegment(point, wall))
    // Check if point is close enough and between the wall's endpoints
    if (distance <= threshold && isPointOnWallSegment(point, wall)) {
      // Return the wall and projected point
      const projectedPoint = projectPointOnLine(point, line);
      return {
        wall: wall,
        point: projectedPoint,
        wallIndex: i,
        type: wall.type || 'external'
      };
    }
  }
  
  return null;
}

// Calculate perpendicular distance from point to line
export const perpDistance=(point, line)=>{
  const numerator = Math.abs(
    (line.y2 - line.y1) * point.x - 
    (line.x2 - line.x1) * point.y + 
    line.x2 * line.y1 - 
    line.y2 * line.x1
  );
  
  const denominator = Math.sqrt(
    Math.pow(line.y2 - line.y1, 2) + 
    Math.pow(line.x2 - line.x1, 2)
  );
  
  return numerator / denominator;
}

// Check if point projection lies on the wall segment
export const isPointOnWallSegment=(point, wall)=>{
 // console.log("point",wall,point)
    if(!wall) return false
    if(!point) return false 
    if(wall.start.x == wall.end.x) return utils.btwn(point.y, wall.start.y, wall.end.y) && utils.btwn(point.x, wall.start.x - 10, wall.end.x + 10)
    if(wall.start.y == wall.end.y) return utils.btwn(point.x, wall.start.x, wall.end.x,10)&& utils.btwn(point.y, wall.start.y - 10, wall.end.y + 10)
    return utils.btwn(point.y, wall.start.y, wall.end.y,5) && utils.btwn(point.x, wall.start.x, wall.end.x,5)
}

// Project point onto line
const projectPointOnLine=(point, line)=>{
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  
  // If the line is actually a point, return the line start
  if (dx === 0 && dy === 0) {
    return { x: line.x1, y: line.y1 };
  }
  
  // Calculate the projection parameter
  const t = ((point.x - line.x1) * dx + (point.y - line.y1) * dy) / 
            (dx * dx + dy * dy);
  
  // Constrain t to lie within the line segment
  const tConstrained = Math.max(0, Math.min(1, t));
  
  // Calculate the projected point
  return {
    x: line.x1 + tConstrained * dx,
    y: line.y1 + tConstrained * dy
  };
}
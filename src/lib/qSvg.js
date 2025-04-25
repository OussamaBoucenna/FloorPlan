// src/utils/roomDetection.js
import {junctionList,rayCasting,vertexList,segmentTree,areaRoom,arrayCompare,polygonIntoWalls,area, calculatePolygonCentroid} from "./helper"
import { isPointInPolygon } from "./utils";
export const PIXELS_PER_METER=100;
export const ORIGIN_X=0;
export const ORIGIN_Y=0;
// Function to check if two line segments intersect
function doLinesIntersect(line1, line2) {
  const x1 = line1.start.x;
  const y1 = line1.start.y;
  const x2 = line1.end.x;
  const y2 = line1.end.y;
  
  const x3 = line2.start.x;
  const y3 = line2.start.y;
  const x4 = line2.end.x;
  const y4 = line2.end.y;

  // Check if either of the lines is a point
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  // Lines are represented as a + bt = c + ds where t and s are parameters
  const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  
  // Lines are parallel
  if (denominator === 0) {
    return false;
  }
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  
  // Check if intersection occurs within both line segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }
  
  // Calculate intersection point
  const x = x1 + ua * (x2 - x1);
  const y = y1 + ua * (y2 - y1);
  
  // Use slightly larger tolerance for endpoint detection
  const tolerance = 0.5; // Increased tolerance for better intersection detection
  
  const isEndpoint1 = 
    (Math.abs(x - x1) < tolerance && Math.abs(y - y1) < tolerance) ||
    (Math.abs(x - x2) < tolerance && Math.abs(y - y2) < tolerance);
  const isEndpoint2 = 
    (Math.abs(x - x3) < tolerance && Math.abs(y - y3) < tolerance) ||
    (Math.abs(x - x4) < tolerance && Math.abs(y - y4) < tolerance);
    
  // If it's an endpoint of both lines, it's not a mid-segment intersection
  if (isEndpoint1 && isEndpoint2) {
    return false;
  }
  
  return {
    x: x,
    y: y,
    isEndpoint1: isEndpoint1,
    isEndpoint2: isEndpoint2
  };
}

// Function to check if two points are very close to each other
function pointsAreClose(p1, p2, tolerance = 0.5) { // Increased default tolerance
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

// Function to create a deep copy of a wall
function cloneWall(wall) {
  return {
    start: { ...wall.start },
    end: { ...wall.end },
    type: wall.type,
    parent: wall.parent,
    thick: wall.thick,
    color: wall.color,
    graph: wall.graph,
    // Preserve any other properties the wall might have
    ...Object.fromEntries(
      Object.entries(wall).filter(([key]) => 
        !['start', 'end', 'type', 'parent', 'thick', 'color', 'graph'].includes(key)
      )
    )
  };
}

// Helper function to check if a point lies on a line segment
function isPointOnLine(point, lineStart, lineEnd, tolerance = 0.5) {
  // Calculate distances
  const d1 = Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
  const d2 = Math.sqrt(Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2));
  const lineLength = Math.sqrt(Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2));
  
  // Check if point is on line within tolerance
  return Math.abs(d1 + d2 - lineLength) < tolerance;
}

// Helper: Normalize path for duplicate checking
function normalizePath(path) {
  return [...path].sort((a, b) => a - b).join('-');
}

// Helper: Check if polygon A is fully inside polygon B
function isPolygonInside(polyA, polyB) {
  return polyA.every(point => rayCasting(point, polyB));
}

// Helper function to calculate polygon area precisely
export const calculatePolygonArea=(points, pixelsPerMeter = 100, returnObject = true)=>{
  // Calculate area using shoelace formula
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    total += points[i].x * points[j].y;
    total -= points[j].x * points[i].y;
  }
  
  // Get area in square pixels
  const areaInSquarePixels = Math.abs(total) / 2;
  
  // Convert to square meters (100px = 1m, so 10000px² = 1m²)
  const areaInSquareMeters = areaInSquarePixels / (pixelsPerMeter * pixelsPerMeter);
  
  if (returnObject) {
    return {
      pixelArea: areaInSquarePixels,
      squareMeters: areaInSquareMeters,
      formattedArea: areaInSquareMeters.toFixed(2) + " m²"
    };
  }
  return areaInSquarePixels;
}

// Enhanced check if a polygon is clockwise or counterclockwise
function isPolygonClockwise(points) {
  // Use shoelace formula for more reliable orientation detection
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  return sum > 0;
}

// Enhanced preprocessing function
function preprocessWalls(walls) {
 // console.log(`Starting preprocessing with ${walls.length} walls`);
  
  // Create a deep copy of the walls to avoid modifying the originals
  let modifiedWalls = walls.map(cloneWall);
  
  // STEP 1: HANDLE T-JUNCTIONS
  let tJunctionFound;
  do {
    tJunctionFound = false;
    const processedWalls = [];
    const newWalls = [];
    
    // Process each wall one by one
    for (let i = 0; i < modifiedWalls.length; i++) {
      const wall = modifiedWalls[i];
      let wallSplit = false;
      
      // Check this wall against all previously processed walls
      for (let j = 0; j < modifiedWalls.length; j++) {
        if (i === j) continue;
        
        const otherWall = modifiedWalls[j];
        
        // Check if start point of otherWall lies on wall
        if (!pointsAreClose(otherWall.start, wall.start, 1) && 
            !pointsAreClose(otherWall.start, wall.end, 1) && 
            isPointOnLine(otherWall.start, wall.start, wall.end, 1)) {
          
          tJunctionFound = true;
          wallSplit = true;
          
          // Split wall at this point
          const newWall1 = cloneWall(wall);
          newWall1.end = { ...otherWall.start };
          
          const newWall2 = cloneWall(wall);
          newWall2.start = { ...otherWall.start };
          
          // Only add the split walls if they have some length
          const length1 = Math.hypot(
            newWall1.end.x - newWall1.start.x,
            newWall1.end.y - newWall1.start.y
          );
          
          const length2 = Math.hypot(
            newWall2.end.x - newWall2.start.x,
            newWall2.end.y - newWall2.start.y
          );
          
          if (length1 > 1) newWalls.push(newWall1);
          if (length2 > 1) newWalls.push(newWall2);
          break;
        }
        
        // Check if end point of otherWall lies on wall
        if (!pointsAreClose(otherWall.end, wall.start, 1) && 
            !pointsAreClose(otherWall.end, wall.end, 1) && 
            isPointOnLine(otherWall.end, wall.start, wall.end, 1)) {
          
          tJunctionFound = true;
          wallSplit = true;
          
          // Split wall at this point
          const newWall1 = cloneWall(wall);
          newWall1.end = { ...otherWall.end };
          
          const newWall2 = cloneWall(wall);
          newWall2.start = { ...otherWall.end };
          
          // Only add the split walls if they have some length
          const length1 = Math.hypot(
            newWall1.end.x - newWall1.start.x,
            newWall1.end.y - newWall1.start.y
          );
          
          const length2 = Math.hypot(
            newWall2.end.x - newWall2.start.x,
            newWall2.end.y - newWall2.start.y
          );
          
          if (length1 > 1) newWalls.push(newWall1);
          if (length2 > 1) newWalls.push(newWall2);
          break;
        }
      }
      
      // If the wall wasn't split, keep it as is
      if (!wallSplit) {
        processedWalls.push(wall);
      }
    }
    
    // Update the modifiedWalls for the next iteration
    modifiedWalls = [...processedWalls, ...newWalls];
   // console.log(`After T-junction processing: ${modifiedWalls.length} walls (${newWalls.length} new)`);
    
  } while (tJunctionFound);
  
 // STEP 2: HANDLE INTERSECTIONS
 let wallsWithIntersections = [...modifiedWalls];
 let intersectionsFound;

 do {
   intersectionsFound = false;
   const nextWalls = [];
   // 1) drop any nulls from the last iteration
   wallsWithIntersections = wallsWithIntersections.filter(Boolean);

   // 2) test each wall against the ones after it
   for (let i = 0; i < wallsWithIntersections.length; i++) {
     const w1 = wallsWithIntersections[i];
     let splitW1 = false;

     for (let j = i + 1; j < wallsWithIntersections.length; j++) {
       const w2 = wallsWithIntersections[j];
       if (!w2) continue;  // skip walls already removed

       // skip if they share endpoints
       if (
         pointsAreClose(w1.start, w2.start, 1) ||
         pointsAreClose(w1.start, w2.end,   1) ||
         pointsAreClose(w1.end,   w2.start, 1) ||
         pointsAreClose(w1.end,   w2.end,   1)
        ) continue;

        const inter = doLinesIntersect(
          { start: w1.start, end: w1.end },
          { start: w2.start, end: w2.end }
        );
        if (!inter) continue;

        // we have a true intersection
        intersectionsFound = true;
        splitW1 = true;
        const P = { x: inter.x, y: inter.y };

        // split w1 if intersection not at its endpoint
        if (!inter.isEndpoint1) {
          const w1a = cloneWall(w1), w1b = cloneWall(w1);
          w1a.end   = P;
          w1b.start = P;
          if (Math.hypot(w1a.end.x - w1a.start.x, w1a.end.y - w1a.start.y) > 1) nextWalls.push(w1a);
          if (Math.hypot(w1b.end.x - w1b.start.x, w1b.end.y - w1b.start.y) > 1) nextWalls.push(w1b);
        } else {
          nextWalls.push(w1);
        }
          // split w2 if intersection not at its endpoint
          if (!inter.isEndpoint2) {
            const w2a = cloneWall(w2), w2b = cloneWall(w2);
            w2a.end   = P;
            w2b.start = P;
            if (Math.hypot(w2a.end.x - w2a.start.x, w2a.end.y - w2a.start.y) > 1) nextWalls.push(w2a);
            if (Math.hypot(w2b.end.x - w2b.start.x, w2b.end.y - w2b.start.y) > 1) nextWalls.push(w2b);
          }
          // mark w2 as removed so we skip it later
          wallsWithIntersections[j] = null;
          break;
        }
  
        // if w1 never intersected or was already handled, keep it
        if (!splitW1) {
          nextWalls.push(w1);
        }
      }
  
      wallsWithIntersections = nextWalls;
    } while (intersectionsFound);
 
  // STEP 3: REMOVE DUPLICATE WALLS
  const uniqueWalls = [];
  const wallSignatures = new Map();

  // Deduplicate using the final intersection results
  for (const wall of wallsWithIntersections) {
    const minX = Math.min(wall.start.x, wall.end.x);
    const minY = Math.min(wall.start.y, wall.end.y);
    const maxX = Math.max(wall.start.x, wall.end.x);
    const maxY = Math.max(wall.start.y, wall.end.y);

    // Round to 0.1 to avoid FP issues
    const signature = `${minX.toFixed(1)},${minY.toFixed(1)}-${maxX.toFixed(1)},${maxY.toFixed(1)}`;

    if (!wallSignatures.has(signature)) {
      wallSignatures.set(signature, wall);
      uniqueWalls.push(wall);
    }
  }

//  console.log(`Final wall count after preprocessing: ${uniqueWalls.length}`);
  return uniqueWalls;
}

export function polygonize(WALLS) {
 // console.log("polygonize called with", WALLS.length, "walls");
  
  // Create deep copies of walls to avoid modifying originals
  const wallsCopy = WALLS.map(cloneWall);
  const hasPartitions = WALLS.some(w => w.type === 'partition');
  const partitionCount = wallsCopy.filter(w => w.type === 'partition').length;
 console.log("Partition wall count:", partitionCount);

  // Preprocess walls to handle intersections
 const processedWalls = preprocessWalls(wallsCopy);
  //console.log("Processed walls:", processedWalls.length);

  // Generate graph structure
  const junction = junctionList(processedWalls);
  const vertex = vertexList(junction, processedWalls);
  const vertexCopy = JSON.parse(JSON.stringify(vertex));
  
 // console.log("Vertices:", vertex.length);
  
  // Build a wall map for edge lookup - FIXED
  const wallMap = new Map();
  const partitionVertices = new Set();
  for (const wall of processedWalls) {
    for (let i = 0; i < vertex.length; i++) {
      for (let j = 0; j < vertex.length; j++) {
        if (i === j) continue;
        
        const v1 = { x: vertex[i].x, y: vertex[i].y };
        const v2 = { x: vertex[j].x, y: vertex[j].y };
        
        if ((pointsAreClose(wall.start, v1, 5) && pointsAreClose(wall.end, v2, 5)) ||
            (pointsAreClose(wall.start, v2, 5) && pointsAreClose(wall.end, v1,5))) {
          const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
          wallMap.set(key, wall);
          
          // Debug for partition walls
          if (wall.type === 'partition') {
            partitionVertices.add(i)
            partitionVertices.add(j);
           // console.log(`Found partition wall connecting vertices ${i} and ${j}`);
          }
        }
      }
    }
  }
  
  const allVertices = Array.from({ length: vertex.length }, (_, i) => i);
  
  // Second method: Using direct vertex to walls mapping (more reliable)
 /* vertexToWalls.forEach((walls, vertexIdx) => {
    for (const { wall } of walls) {
      if (wall.type === 'partition') {
        partitionVertices.add(vertexIdx);
      }
    }
  });*/
  
 // console.log("Partition vertices:", [...partitionVertices]);
  
  // If we still have no partition vertices but have partition walls, try a more direct approach
  /*if (partitionVertices.size === 0 && partitionCount > 0) {
    console.log("No partition vertices found despite having partition walls. Trying direct approach...");
    
    // Directly create connections based on the walls themselves
    for (let i = 0; i < processedWalls.length; i++) {
      const wall = processedWalls[i];
      
      if (wall.type === 'partition') {
        // Find vertices for this partition wall
        for (let j = 0; j < vertex.length; j++) {
          const v = { x: vertex[j].x, y: vertex[j].y };
          
          if (pointsAreClose(wall.start, v, 1.0) || pointsAreClose(wall.end, v, 1.0)) {
            partitionVertices.add(j);
            console.log(`Added vertex ${j} to partition vertices (direct approach)`);
          }
        }
      }
    }
    
    console.log("Partition vertices after direct approach:", [...partitionVertices]);
  }*/
  // --- COMBINED CYCLE DETECTION ---
const hallwayProcessedPaths = new Set();
const hallwayCycles        = [];
const allCycles            = [];
const roomCycles           = [];

const startPoints = hasPartitions 
  ? [...partitionVertices] 
  : allVertices;

for (const startIdx of startPoints) {
  if (vertex[startIdx].child.length < 2) continue;
  const WAYS = segmentTree(startIdx, vertex);

  for (const way of WAYS) {
    const path = way.split('-').map(Number);
    if (path.length < 3) continue;

    // skip tiny areas
    const areaGuess = areaRoom(vertex, path);
    if (areaGuess < 50) continue;

    // dedupe by normalized path
    const key = normalizePath(path);
    if (hallwayProcessedPaths.has(key)) continue;
    hallwayProcessedPaths.add(key);

    // build coords and count walls
    const coords = path.map(i => ({ x: vertex[i].x, y: vertex[i].y }));
    let partitionCount = 0, regularCount = 0;
    const edgeKeys = new Set();

    for (let i = 0; i < path.length; i++) {
      const a = Math.min(path[i], path[(i + 1) % path.length]);
      const b = Math.max(path[i], path[(i + 1) % path.length]);
      const edgeKey = `${a}-${b}`;
      edgeKeys.add(edgeKey);
      const wall = wallMap.get(edgeKey);
      if (wall) {
        if (wall.type === 'partition') partitionCount++;
        else                      regularCount++;
      }
    }

    const areaInfo = calculatePolygonArea(coords,PIXELS_PER_METER);

    // push to hallway / allCycles
    hallwayCycles.push({ path, coords,
      area: areaInfo.squareMeters, 
      pixelArea: areaInfo.pixelArea,
       partitionCount,
        regularCount });
    allCycles.push ({ path,
      area: areaInfo.squareMeters, 
      pixelArea: areaInfo.pixelArea,
      coords, partitionCount,
       regularCount });

    // if partitions exist, filter into roomCycles
    if (hasPartitions &&
        partitionCount > 0 &&              // must use a partition
        path.length >= 4 &&                // at least 4 edges
        edgeKeys.size / Math.sqrt(areaInfo.pixelArea) <= 0.5 // complexity check
    ) {
      roomCycles.push({
        path,
        coords,
        area: areaInfo.squareMeters,
        pixelArea: areaInfo.pixelArea,
        partitionCount,
        regularCount,
        edgeKeys: Array.from(edgeKeys),
        type: 'room'
      });
    }
  }
}

console.log(`Found ${allCycles.length} cycles (${roomCycles.length} rooms, ${hallwayCycles.length} hallways)`);

  let finalPolygons = [];
  let hallwayArea = 0;
  hallwayCycles.sort((a, b) => b.area - a.area);
  let hallway = hallwayCycles[0];
  if(hallway){
    hallwayArea= hallway.area;
    finalPolygons.push({
    ...hallway,
    type: "hallway",
  })
  }


  const uniqueRooms = [];
  roomCycles.sort((a, b) => a.area - b.area);
  
  for (const room of roomCycles) {
    // skip tiny artifacts
    if (room.area < 2) continue;
  
    // compute true centroid
    const center = calculatePolygonCentroid(room.coords);
    room.center = center;
  
    let isDuplicate = false;
    for (const ex of uniqueRooms) {
      // ensure ex.center is set
      if (!ex.center) ex.center = calculatePolygonCentroid(ex.coords);
  
      // distance between centroids
      const d = Math.hypot(center.x - ex.center.x, center.y - ex.center.y);
      // dynamic threshold ≈ half the room’s “diameter”
      const thresh = Math.sqrt(room.area) * 0.5;
  
      // only compare if sizes within ±20%
      const ratio = room.area / ex.area;
      if (ratio > 0.8 && ratio < 1.2 && d < thresh) {
        // count shared edges
        const shared = room.edgeKeys.filter(e => ex.edgeKeys.includes(e)).length;
        const shareRatio = shared / Math.min(room.edgeKeys.length, ex.edgeKeys.length);
        // if they share >50% of edges → duplicate
        if (shareRatio > 0.5) {
          isDuplicate = true;
          break;
        }
      }
    }
  
    if (!isDuplicate) {
      uniqueRooms.push(room);
    }

    uniqueRooms.sort((a, b) => b.area - a.area);
    const largestRoom = uniqueRooms[0];
    const isInsideHallway = isPolygonInside(largestRoom.coords,hallway.coords) 
    if(isInsideHallway){
     // console.log("Largest room is inside the hallway, removing it from valid rooms")
      uniqueRooms.shift()
      // override the hallway to take the largest room
      hallway=largestRoom
      hallway.type="hallway"
      finalPolygons[0]=hallway
    }
  }
  
  // now uniqueRooms contains only one cycle per true room
// Replace the final room filtering section with this enhanced logic
console.log(uniqueRooms)
const validRooms = [];
if (hasPartitions && uniqueRooms.length > 0) {
  const wrapperRoomIndices = new Set();

  for (let i = 0; i < uniqueRooms.length; i++) {
    for (let j = 0; j < uniqueRooms.length; j++) {
      if (i === j) continue;
      const centerJ = uniqueRooms[j]?.center ? uniqueRooms[j].center : calculatePolygonCentroid(uniqueRooms[j].coords);
      if (
        isPointInPolygon(centerJ, uniqueRooms[i].coords) &&
        uniqueRooms[i].area > uniqueRooms[j].area
      ) {
        //console.log(`Room ${i} contains room ${j}`);
        wrapperRoomIndices.add(i);
      }
    }
  }

  for (let i = 0; i < uniqueRooms.length; i++) {
    if (!wrapperRoomIndices.has(i)) {
      validRooms.push(uniqueRooms[i]);
    }
  }

 // console.log(`Found ${validRooms.length} valid interior rooms after removing wrappers`);
}
  //console.log(`Found ${hallwayCycles.length} potential hallway cycles`);
  
  // --- FINAL CYCLE SELECTION ---
  // 1. Filter rooms (if any)
  
  // Add rooms
  /*for (const room of validRooms) {
    const realCoords = polygonIntoWalls(vertex, room.path, processedWalls);
    finalPolygons.push({
      way: room.path,
      coords: room.coords,
      coordsOutside: realCoords.outside,
      coordsInside: realCoords.inside,
      area: area(realCoords.inside),
      outsideArea: area(realCoords.outside),
      realArea: parseInt(room.area),
      hasPartition: room.partitionCount > 0,
      type: "room"
    });
  }*/
/*
    const containerRoomIndexArr = [];
    
    if(validRooms.length > 2){
      const sortedRooms = [...validRooms].sort((a, b) => b.area - a.area);
      const largestRoom = sortedRooms[0];
      let containsOtherRooms = 0;
  for (let i = 1; i < sortedRooms.length; i++) {
    const otherRoom = sortedRooms[i];
    
    // Check if the center of the smaller room is inside the largest one
    const roomCenter = {
      x: otherRoom.coords.reduce((sum, p) => sum + p.x, 0) / otherRoom.coords.length,
      y: otherRoom.coords.reduce((sum, p) => sum + p.y, 0) / otherRoom.coords.length
    };
    
    if (rayCasting(roomCenter, largestRoom.coords)) {
      containsOtherRooms++;
    }
  }
  // If the largest room contains most other rooms, it's likely the container
  if (containsOtherRooms >= Math.floor(sortedRooms.length / 2)) {
    //console.log(`Identified container room with area ${largestRoom.area} containing ${containsOtherRooms} other rooms`);
    const containerRoomIndex =  validRooms.findIndex(r => r.area === largestRoom.area);
    //const  = [];
    containerRoomIndexArr.push(containerRoomIndex);
  }
    }
    console.log("containerRoomIndexArr",containerRoomIndexArr)
   
    for (const room of validRooms) {
      const roomIndex = validRooms.indexOf(room);
      if(containerRoomIndexArr.includes(roomIndex)) continue;
      if (room.area < hallwayArea) { 
        finalPolygons.push({ 
          way:           room.path, 
          coords:        room.coords,    // use the interior polygon 
          area:          room.area, 
          outsideArea:   hallwayArea, 
          //realArea:      parseInt(room.area), 
          hasPartition:  room.partitionCount > 0, 
          type:          "room" 
        }); 
      }  
   }
    
*/
 //  console.log("VALID ROOOM",validRooms)
  
   finalPolygons. push(...validRooms)
  // Add hallway if found
/*  let hallway = null;
  
  // Sort hallway candidates by area (largest first)
  hallwayCycles.sort((a, b) => b.area - a.area);
  
  if (hasPartitions && validRooms.length > 0) {
    // Find a hallway that contains at least one room
    for (const candidate of hallwayCycles) {
      let containsAllRooms = true;
      
      for (const room of validRooms) {
        const roomCenter = {
          x: room.coords.reduce((sum, p) => sum + p.x, 0) / room.coords.length,
          y: room.coords.reduce((sum, p) => sum + p.y, 0) / room.coords.length
        };
        
        if (!rayCasting(roomCenter, candidate.coords)) {
          containsAllRooms = false;
          break;
        }
      }
      
      if (containsAllRooms && candidate.area > validRooms[0].area * 1.2) {
        hallway = candidate;
        break;
      }
    }
  }
  
  // If no hallway found or no partitions, use the largest cycle as hallway
  if (!hallway && hallwayCycles.length > 0) {
    hallway = hallwayCycles[0];
  }
  
  if (hallway) {
 //   const realCoords = polygonIntoWalls(vertex, hallway.path, processedWalls);
    finalPolygons.push({
      way: hallway.path,
      coords: hallway.coords,
      //coordsOutside: realCoords.outside,
      //coordsInside: realCoords.inside,
      area: hallway.area,
      //outsideArea: area(realCoords.outside),
      //realArea: parseInt(hallway.area),
      hasPartition: hallway.partitionCount > 0,
      type: "hallway"
    });
  }
  */
 // console.log(`Final polygons: ${finalPolygons.length} (${uniqueRooms.length} rooms, ${hallway ? 1 : 0} hallways)`);
  return { polygons: finalPolygons, vertex: vertexCopy };
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


export const pixelsToMeters = (pixelValue)=>{
  return ((pixelValue - ORIGIN_X) / PIXELS_PER_METER).toFixed(2)
}

export const metersToPixels=(meterValue)=>{
  return (meterValue * PIXELS_PER_METER) + ORIGIN_X
}
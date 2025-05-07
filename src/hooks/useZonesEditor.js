import { useState, useRef, useEffect } from 'react';
import { calculateWallPolygon, computeWallAngle, findConnectedWalls, findWallAtPoint, isPointNearWall, nearWall, nearWallNode } from '../lib/walls';
import { middle, polygonize } from '../lib/qSvg';
import { almostEqual, nearVertex } from '../lib/helper';
import { calculateSnapPoint, findRoomAtPoint, getRoomCenter, isPointsEqual } from '../lib/utils';
import Obj2D from '../lib/editor';
import { displayMeasurements } from '../Draw';
export const useFloorPlanZones=(ctx,canvasRef,tool,onChangeTool)=>{
  const [walls,setWalls]=useState([])
  const [modeOption,setModeOption]=useState("")
  const [placedObjects,setPlacedObjects]=useState([])
  const [isPreview,setIsPreview]=useState(true)
  const [roomProps,setRoomPropsPanel]=useState({})
  const binderRef = useRef(null)
  const [startMoving,setStartMoving]=useState(false)
  const [binderVersion, setBinderVersion] = useState(1);
  const [action,setAction]=useState(0)
  const [dragState,setDragState]=useState(null)
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [nearNodePoint, setNearNodePoint] = useState(null);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [hoverVertex, setHoverVertex] = useState(null);
  const [selectedVertex, setSelectedVertex] = useState(null);
  const [isDraggingVertex, setIsDraggingVertex] = useState(false);
  const [connectedWalls, setConnectedWalls] = useState([]);
  const [selectedRoom,setSelectedRoom]=useState(null)
  const [rooms,setRooms]= useState({polygons:[]});
  const [wallLengthPopup, setWallLengthPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    inputValue: '',
    currentLength: 0
  });
  // Define a palette of colors for rooms
  const roomColorPalette = [
    '#f0daaf', // Beige
    '#d3e4ff', // Light Blue
    '#e0f0d0', // Light Green
    '#f1e2f1', // Light Purple
    '#ffe0e0', // Light Pink
    '#e6f2f2', // Light Cyan
    '#fff4e0', // Light Peach
    '#e6e6fa', // Lavender
    '#ffead7', // Light Orange
    '#e0f2e0'  // Mint Green
  ];

  // Function to assign different colors to adjacent rooms
  const assignRoomColors = (polygons) => {
    if (!polygons || polygons.length === 0) return {};
    
    const colorAssignments = {};
    const adjacentRooms = {}; // Track which rooms are adjacent
    
    // First, identify adjacent rooms
    for (let i = 0; i < polygons.length; i++) {
      adjacentRooms[i] = [];
      
      for (let j = 0; j < polygons.length; j++) {
        if (i === j) continue;
        
        // Check if rooms share any walls
        let sharesWall = false;
        
        // Check if any edge is shared between the two rooms
        for (let e1 = 0; e1 < polygons[i].coords.length; e1++) {
          const p1 = polygons[i].coords[e1];
          const p2 = polygons[i].coords[(e1 + 1) % polygons[i].coords.length];
          
          for (let e2 = 0; e2 < polygons[j].coords.length; e2++) {
            const p3 = polygons[j].coords[e2];
            const p4 = polygons[j].coords[(e2 + 1) % polygons[j].coords.length];
            
            // Check if edges overlap (simplified)
            if ((almostEqual(p1.x, p3.x) && almostEqual(p1.y, p3.y) && 
                 almostEqual(p2.x, p4.x) && almostEqual(p2.y, p4.y)) ||
                (almostEqual(p1.x, p4.x) && almostEqual(p1.y, p4.y) && 
                 almostEqual(p2.x, p3.x) && almostEqual(p2.y, p3.y))) {
              sharesWall = true;
              break;
            }
          }
          if (sharesWall) break;
        }
        
        if (sharesWall) {
          adjacentRooms[i].push(j);
        }
      }
    }
    

    // Assign colors using graph coloring algorithm
    for (let i = 0; i < polygons.length; i++) {
      // Get colors used by adjacent rooms
      const usedColors = adjacentRooms[i].map(adj => colorAssignments[adj]).filter(Boolean);
      
      // Find the first available color not used by neighbors
      for (let color of roomColorPalette) {
        if (!usedColors.includes(color)) {
          colorAssignments[i] = color;
          break;
        }
      }
      
      // If all colors are used by neighbors, just pick the first one
      if (!colorAssignments[i]) {
        colorAssignments[i] = roomColorPalette[0];
      }
    }
    
    return colorAssignments;
  };

  useEffect(() => {
    if (walls.length > 0 && selectedRoom === null) {
      const roomsResult = polygonize(walls);
   //   console.log("ROOMS RESULT",roomsResult)
      // Assign colors to rooms
      if (roomsResult.polygons && roomsResult.polygons.length > 0) {
        const colors = assignRoomColors(roomsResult.polygons);
        
        // Apply colors to the rooms
        for (let i = 0; i < roomsResult.polygons.length; i++) {
          if (colors[i]) {
            roomsResult.polygons[i].color = colors[i];
          }
        }
      }
      setRooms({ ...roomsResult });
    }
  }, [walls]);

    useEffect(()=>{
      walls.forEach(wall => {
        updateWallObjects(wall,wall)
      })
    },[walls])
    // apply wall length function 
    const applyWallLength = (length) => {
      //console.log("APPLY WALL LENGTH",length,startPoint,currentPoint)
      if (!startPoint || !length) return;
     // console.log("APPLY WALL LENGTH",length)
      const lengthInPixels = length * 100;
      
      // Calculate angle between start and current point
      const currentAngle = Math.atan2(
        currentPoint.y - startPoint.y,
        currentPoint.x - startPoint.x
      );
      
      // Calculate new endpoint based on specified length and angle
      const newEndPoint = {
        x: startPoint.x + lengthInPixels * Math.cos(currentAngle),
        y: startPoint.y + lengthInPixels * Math.sin(currentAngle)
      };
      
      setCurrentPoint(newEndPoint);
      // update the wall 
      setWalls(prev => prev.map((wall, index) => {
        if(index==wallLengthPopup.wallId){
          return {
            ...wall,
            start: { ...startPoint },
            end: { ...newEndPoint },
            type: tool,
            wallId : wallLengthPopup.wallId, 
            thickness: wall.thickness
          };
        }
        return wall;
      }))
      // Hide popup
      setWallLengthPopup({...wallLengthPopup, visible: false});
      setStartPoint(null);
      setCurrentPoint(null);
      setAction(0);
    };
    // draw Room function
    const drawRooms = (ctx) => {
      if (!rooms || !rooms.polygons) return;
      Object.entries(rooms.polygons).forEach(([index, room]) => {
        if (!room.coords || room.coords.length < 3) return;
        
        ctx.beginPath();
        ctx.moveTo(room.coords[0].x, room.coords[0].y);
        
        for (let i = 1; i < room.coords.length; i++) {
          ctx.lineTo(room.coords[i].x, room.coords[i].y);
        }
        
        ctx.closePath();
        
        // Fill with room color
        ctx.fillStyle = room?.color || '#f0daaf';
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Calculate center point for text
        const centerX = room.coords.reduce((sum, point) => sum + point.x, 0) / room.coords.length;
        const centerY = room.coords.reduce((sum, point) => sum + point.y, 0) / room.coords.length;
        
        // Display room name if available
        if (room.name) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.fillText(room.name, centerX, centerY - 15);
        }
  
        // Always display area measurement
        if (room.area) {
          const formattedArea = room.area.toFixed(2)+ " m²";
          ctx.font = '12px Arial';
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          ctx.fillText(formattedArea, centerX, centerY + 10);
        }
      });
    };
    const drawWalls = (ctx) => {
      walls.forEach(wall=>{
        const wallPolygon = calculateWallPolygon(wall.start, wall.end, wall.thickness);
      
        ctx.beginPath();
        ctx.moveTo(wallPolygon[0].x, wallPolygon[0].y);
        for(let i = 1; i < wallPolygon.length; i++) {
          ctx.lineTo(wallPolygon[i].x, wallPolygon[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = wall.thickness;
        ctx.fill();
        ctx.stroke();
  
        displayMeasurements(ctx, { x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y });
      })
      
    };

    // Function to draw wall preview
  const drawWallPreview = (ctx, start, end, thickness) => {
    const wallPolygon = calculateWallPolygon(start, end, thickness);
    
    ctx.beginPath();
    ctx.moveTo(wallPolygon[0].x, wallPolygon[0].y);
    for(let i = 1; i < wallPolygon.length; i++) {
      ctx.lineTo(wallPolygon[i].x, wallPolygon[i].y);
    }
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(159, 178, 226, 0.7)';
    ctx.strokeStyle = '#9fb2e2';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    // Show distance measurement
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    );
    const midPoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(distance / 100).toFixed(2)} m`, midPoint.x, midPoint.y - 5);
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };


  // handle wall move

  const handleWallMove = (wallId, e) => {
    const point = getCanvasPoint(e);
    if (!dragState || !dragState.originalWalls) return;
  
    const deltaX = (point.x - dragState.startX) * 0.5;
    const deltaY = (point.y - dragState.startY) * 0.5;
    const newWalls = JSON.parse(JSON.stringify(walls))
    const selWall = newWalls[wallId];
    const origSelWall  = dragState.originalWalls[wallId];
    //console.log("ORIGINAL WALL",origSelWall)
    selWall.start.x = origSelWall.start.x + deltaX;
    selWall.start.y = origSelWall.start.y + deltaY;
    selWall.end.x   = origSelWall.end.x   + deltaX;
    selWall.end.y   = origSelWall.end.y   + deltaY;
      // move wall objects
    updateWallObjects(selWall,origSelWall,point)
  
    if (dragState.connectedWalls) {
        dragState.connectedWalls.forEach(({ wallId: connId }) => {
        if (connId === wallId) return;
        const connWall     = newWalls[connId];
        const origConnWall = dragState.originalWalls[connId];
        if (isPointsEqual(origConnWall.start, origSelWall.start) ||
            isPointsEqual(origConnWall.start, origSelWall.end)) {
          connWall.start.x = origConnWall.start.x + deltaX;
          connWall.start.y = origConnWall.start.y + deltaY;
        }
        if (isPointsEqual(origConnWall.end, origSelWall.start) ||
            isPointsEqual(origConnWall.end, origSelWall.end)) {
          connWall.end.x = origConnWall.end.x + deltaX;
          connWall.end.y = origConnWall.end.y + deltaY;
        }
        updateWallObjects(point,connWall,origConnWall)
      });
    }
    setWalls(newWalls);
  };

  const moveRoomIncremental = (roomId, deltaX, deltaY) => {
    const movementFactor = 1.0;
    const adjustedDeltaX = deltaX * movementFactor;
    const adjustedDeltaY = deltaY * movementFactor;
    
    const newWalls = JSON.parse(JSON.stringify(walls));
    const newRooms = JSON.parse(JSON.stringify(rooms));
    
    const wallsToMove = findWallsForRoom(roomId);
    
    for (let i = 0; i < newRooms.polygons[roomId].coords.length; i++) {
      newRooms.polygons[roomId].coords[i].x += adjustedDeltaX;
      newRooms.polygons[roomId].coords[i].y += adjustedDeltaY;
    }
    
    const innerRooms = newRooms.polygons[roomId].inside || [];
    for (const innerRoomId of innerRooms) {
      for (let i = 0; i < newRooms.polygons[innerRoomId].coords.length; i++) {
        newRooms.polygons[innerRoomId].coords[i].x += adjustedDeltaX;
        newRooms.polygons[innerRoomId].coords[i].y += adjustedDeltaY;
      }
      
      const innerWalls = findWallsForRoom(innerRoomId);
      for (const wallIndex of innerWalls) {
        if (!wallsToMove.includes(wallIndex)) {
          wallsToMove.push(wallIndex);
        }
      }
    }
    
    for (const wallIndex of wallsToMove) {
      newWalls[wallIndex].start.x += adjustedDeltaX;
      newWalls[wallIndex].start.y += adjustedDeltaY;
      newWalls[wallIndex].end.x += adjustedDeltaX;
      newWalls[wallIndex].end.y += adjustedDeltaY;
    }
    
    setWalls(newWalls);
    setRooms(newRooms);
  };


  const findWallsForRoom = (roomId) => {
    const roomCoords = rooms.polygons[roomId].coords;
    const wallIndices = [];
    
    for (let i = 0; i < roomCoords.length - 1; i++) {
      const start = roomCoords[i];
      const end = roomCoords[i + 1];
      
      for (let w = 0; w < walls.length; w++) {
        const wall = walls[w];
        
        if ((almostEqual(wall.start.x, start.x) && 
             almostEqual(wall.start.y, start.y) && 
             almostEqual(wall.end.x, end.x) && 
             almostEqual(wall.end.y, end.y)) ||
            (almostEqual(wall.start.x, end.x) && 
             almostEqual(wall.start.y, end.y) && 
             almostEqual(wall.end.x, start.x) && 
             almostEqual(wall.end.y, start.y))) {
          
          if (!wallIndices.includes(w)) {
            wallIndices.push(w);
          }
          break;
        }
      }
    }
    return wallIndices;
  };
  

  const updateWallObjects=(wall,originWall,point)=>{
  //  console.log("UPDATE WALL OBJECTS",wall,originWall,point)
    const wallId = wall.wallId
    if(!placedObjects.some(obj => obj.wallId == wallId)) return
   const originObject = (dragState && (dragState.type == "doorWindow" || dragState.type=="wall")) ? dragState.objects.filter(origin => origin.wallId == wallId) : null
   //console.log("ORIGIN OBJECT ",originObject)
   placedObjects.filter(obj => obj.wallId == wallId).forEach((obj,i) => {
      const angleWall = point ? computeWallAngle(wall,point) : null;
       const origWallVector = {
        x: originWall.end.x - originWall.start.x,
        y: originWall.end.y - originWall.start.y
      };
      const wallVector = {
        x: wall.end.x - wall.start.x,
        y: wall.end.y - wall.start.y
      };
  

      const origWallLength = Math.sqrt(
        origWallVector.x * origWallVector.x + 
        origWallVector.y * origWallVector.y
      );
  
      const objVector = {
        x: (originObject ?  originObject[i].x : obj.x) - originWall.start.x,
        y:   (originObject ?  originObject[i].y : obj.y) -  originWall.start.y
      };
      const dotProduct = objVector.x * origWallVector.x + objVector.y * origWallVector.y;
      const relativePos = dotProduct / (origWallLength * origWallLength);
    //  console.log("CALLED ",i,relativePos)
      obj.relPos = relativePos;
  
  obj.x = wall.start.x + relativePos * wallVector.x
  obj.y = wall.start.y + relativePos * wallVector.y;
  obj.angle  = angleWall ?  angleWall.angle : obj.angle;
  obj.angleSign = angleWall ? angleWall.angleSign : obj.angleSign; 
  obj.thick  = wall.thickness;
  obj.update();
  
  })
  
  }
  


  const findObjectUnderCursor=(point)=>{
    for (let i = placedObjects.length - 1; i >= 0; i--) {
      const obj = placedObjects[i];
      if (obj.containsPoint && obj.containsPoint(point)) {
        return obj;
      }
    }
    return null;
  }


  const handleVertexDrag = (point) => {
      if (!selectedVertex || !isDraggingVertex) return;
      connectedWalls.forEach(({ wall, isStart }) => {
        const oppositeEnd = isStart ? wall.end : wall.start;
        
        if (Math.abs(oppositeEnd.x - point.x) < 20) {
          point.x = oppositeEnd.x;
        }
        
        if (Math.abs(oppositeEnd.y - point.y) < 20) {
          point.y = oppositeEnd.y;
        }
      });
      
      const newWalls = [...walls];
      
      connectedWalls.forEach(({ wall, isStart, index }) => {
        if (isStart) {
          newWalls[index] = {
            ...newWalls[index],
            start: {
              x: point.x,
              y: point.y
            }
          };
        } else {
          newWalls[index] = {
            ...newWalls[index],
            end: {
              x: point.x,
              y: point.y
            }
          };
        }
      });
      setWalls(newWalls);
      newWalls.forEach(wall=>updateWallObjects(wall,wall,point))
    };

  const updateRoomsForWalls=(currentWalls)=>{
    const roomsResult = polygonize(currentWalls);
    setRooms(roomsResult);
  }

  const finishWall = (type) => {
    if (!startPoint || !currentPoint) return;
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - startPoint.x, 2) + 
      Math.pow(currentPoint.y - startPoint.y, 2)
    );
    
    if (distance > 15) {
      const newWall = {
        start: { ...startPoint },
        end: { ...currentPoint },
        type,
        wallId : walls?.length, 
        thickness: tool === 'wall' ? 10 : 6
      };
      
      setWalls(prevWalls => [...prevWalls, newWall]);
      
      if (isMultiMode) {
        setStartPoint(currentPoint);
      } else {
        setAction(0);
       // setStartPoint(null);
        //setCurrentPoint(null);
      }
      // Instead of immediately creating a wall, show the popup
      setWallLengthPopup({
        ...wallLengthPopup,
        visible: true,
        wallId:walls.length,
        x: (startPoint.x + currentPoint.x) / 2,
        y: (startPoint.y + currentPoint.y) / 2 - 40
      });
      
      // Don't finish the wall yet - that will happen when applyWallLength is called
      // We also don't reset action, startPoint and currentPoint yet
    } else {
      // For very short movements, just cancel
      setAction(0);
      setStartPoint(null);
      setCurrentPoint(null);
      setWallLengthPopup({...wallLengthPopup, visible: false});
    }

  };

  const handleMouseDown = (event)=>{
    const point = getCanvasPoint(event);
        if (tool === 'select') {
          const vertex = nearVertex(walls,point,10)
          if(vertex){
            if(selectedRoom!=null) setSelectedRoom(null)
            setSelectedVertex(vertex)
            setConnectedWalls(vertex.walls)
            setIsDraggingVertex(true);
            return 
          }
          const objectTarget = findObjectUnderCursor(point)
          if(objectTarget && (objectTarget.class == "doorWindow" || objectTarget.family == "inWall")){
            setDragState({
              type: 'doorWindow',
              id: objectTarget.id,
              startX: point.x,
              startY: point.y,
              originalObj: {
                x: objectTarget.x,
                y: objectTarget.y,
                angle: objectTarget.angle,
                wallId: objectTarget.wallId
              }
            });
        if (!binderRef.current) {
          binderRef.current = objectTarget;
        }
        onChangeTool("door_mode")
        setIsPreview(true)
        setBinderVersion(prev => prev + 1)
        return 
          }
          const wallInfo = nearWall(point, 6,walls);
          const {wall,wallId}=wallInfo
        if (wall) {
          if(selectedRoom!=null) setSelectedRoom(null)
        const connectedWalls= findConnectedWalls(walls,wallId);
      const wallIds = connectedWalls?.map(wall=>wall.wallId )
        setDragState({
          type: 'wall',
          id: wallId,
          startX: point.x,
          startY: point.y,
          connectedWalls: connectedWalls,
          objects : placedObjects.filter(obj => [wallId,...wallIds].includes(obj.wall.wallId)).map(obj => obj.clone()),
          originalWalls: walls.map(wall => ({
            start: { ...wall.start },
            end: { ...wall.end }
          }))
        });

        // Show wall length popup for selected wall
    const selectedWall = walls[wallId];
    const distance = Math.sqrt(
      Math.pow(selectedWall.end.x - selectedWall.start.x, 2) + 
      Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
    );
    
    setStartPoint(selectedWall.start);
    setCurrentPoint(selectedWall.end);
    
    setWallLengthPopup({
      visible: true,
      wallId: wallId,
      x: (selectedWall.start.x + selectedWall.end.x) / 2,
      y: (selectedWall.start.y + selectedWall.end.y) / 2 - 40,
      inputValue: (distance / 100).toFixed(2),
      currentLength: distance / 100
    });
    
    return;

        return 
      }else{
        if(rooms.polygons){   
        const roomId = findRoomAtPoint(rooms,point);
          if (roomId !== null) {
            setSelectedRoom(roomId)
            setRoomPropsPanel({
              visible: true,
              name: rooms.polygons[roomId]?.name || '',
              color: rooms.polygons[roomId]?.color || '#f0daaf'
            });
            setDragState({
              type: 'room',
              id: roomId,
              startX: point.x,
              startY: point.y,
              lastX: point.x,  
              lastY: point.y,
              roomCenterX: getRoomCenter(rooms,roomId).x,
              roomCenterY: getRoomCenter(rooms,roomId).y
            });
          }
          }else{
              const wallId = findWallAtPoint(point);
              if (wallId !== null) {
                if(selectedRoom!=null) setSelectedRoom(null)
                setDragState({
                  type: 'wall',
                  id: wallId,
                  startX: point.x,
                  startY: point.y,
                  origStart: {...walls[wallId].start},
                  origEnd: {...walls[wallId].end}
                });
              }
          }}
        }else{
        
        if (tool !== 'wall' && tool !== 'partition') return;
        const snap = calculateSnapPoint(walls,point);
        
        if (action === 0) {
          setStartPoint(snap);
          setAction(1);
        } else {
          finishWall();
        }}
  }

  const cancelWallLengthPopup = () => {
    setWallLengthPopup({
      ...wallLengthPopup, 
      visible: false
    });
  };

   const handleMouseMove = (event) => {
      if(tool!="door_mode"){
        binderRef.current
        =null
      }
      const point = getCanvasPoint(event);
      if (isDraggingVertex && selectedVertex) {
        handleVertexDrag(point);
        return;
      }
        if(tool=="select"){
          const vertex = nearVertex(walls,point,10);
          if (vertex) {
            setHoverVertex(vertex);
          } else if (hoverVertex) {
            setHoverVertex(null);
          }
        if (!dragState) return;
      if (dragState.type === 'room') {
        const deltaX = point.x - dragState.lastX;
        const deltaY = point.y - dragState.lastY;
        moveRoomIncremental(dragState.id, deltaX, deltaY);
        setDragState({
          ...dragState,
          lastX: point.x,
          lastY: point.y
        });
      }
      if(dragState.type =="doorWindow"){
        if(binderRef.current){
          binderRef.current.update()
        }
      }
      if (dragState.type === 'wall') {
        //setStartMoving(true)
        setWallLengthPopup({...wallLengthPopup,visible:false})
        handleWallMove(dragState.id,event);
      }
      }
      if ((tool === 'wall' || tool === 'partition') && action === 1) {
        const point = getCanvasPoint(event);
        const snap = calculateSnapPoint(walls,point);
        const nearNode = isPointNearWall(point,walls,10)
        if (nearNode) {
          setCurrentPoint(snap);
          setNearNodePoint(nearNode);
        } else {
          setCurrentPoint(snap);
          setNearNodePoint(null);
        }
        const distance = Math.sqrt(
    Math.pow(snap.x - startPoint.x, 2) + 
    Math.pow(snap.y - startPoint.y, 2)
  );
  
  // Store the current length for use in handleMouseUp
  setWallLengthPopup({
    visible: false, // Keep hidden during movement
    x: (startPoint.x + snap.x) / 2,
    y: (startPoint.y + snap.y) / 2 - 40,
    inputValue: (distance / 100).toFixed(2),
    currentLength: distance / 100
  });
      } else if (tool === "door_mode") {
        const point = getCanvasPoint(event);
        const wallSelect = nearWall(point, 10, walls);
        if (wallSelect) {
          const { wall, wallId } = wallSelect;
          setIsPreview(true)
          if (!binderRef.current) {
            const {angle,angleSign} = computeWallAngle(wall, point);
            const startCoords = middle(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
            const doorObj = new Obj2D(
            "inWall", 
            "doorWindow", 
            modeOption, 
            wallId,
            { x: startCoords.x, y: startCoords.y, wall: wall }, 
            angle, 
            angleSign, 
            60,
            "normal", 
            wall.thickness
            );
            binderRef.current=doorObj
           
          }else {
          const wall = wallSelect.wall;
          
          const {angle,angleSign} = computeWallAngle(
            wall,point
          );
          binderRef.current.wall = wall;
          binderRef.current.wallId = wallId;
         binderRef.current.x = wallSelect.x;
         binderRef.current.y = wallSelect.y;
         binderRef.current.angle = angle;
         binderRef.current.angleSign = angleSign;
         binderRef.current.thick = wall.thickness;
          setBinderVersion(prev => prev +1)
         binderRef.current.update();
          }
        }
      } else{
        const point = getCanvasPoint(event)
        const nearNode = isPointNearWall(point,walls,10)
        setNearNodePoint(nearNode);
      }
    };

    const handleMouseUp = (event) => {
    if(tool=="select"){
      
      if (isDraggingVertex) {
        setIsDraggingVertex(false);
        const updatedRooms = polygonize(walls);
        setRooms(updatedRooms);
        setSelectedVertex(null);
        setHoverVertex(null)
        setConnectedWalls([]);
      }
      
      if (!dragState) return;
       if (dragState.type === 'wall') {
       // setWallLengthPopup({...wallLengthPopup,visible:false})
      updateRoomsForWalls(walls);
    }
    setDragState(null)}
      else if ((tool === 'wall' || tool === 'partition') && action === 1) {
        //finishWall(tool);
      }else if(tool=="door_mode" && binderRef.current){
        setPlacedObjects(prevObjects => [...prevObjects, new Object(binderRef.current)]);
        setIsPreview(false);
       onChangeTool("select");
        }
    };
  
    const onCancelUpdate=()=>{
      setSelectedRoom(null)
      setRoomPropsPanel({...roomProps, visible:false})
    }

    const handleSelectDoorType=(type)=>{
      setModeOption(type)
    }
  

  return {
    drawRooms,
    drawWalls,
    handleSelectDoorType,
    drawWallPreview,
    getCanvasPoint,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setNearNodePoint,
    setStartPoint,
    setCurrentPoint,
    setRooms,
    setWalls,
    setAction,
    setIsMultiMode,
    action,
    isPreview,
    currentPoint,
    startPoint,
    selectedVertex,
    isMultiMode,
    walls,
    placedObjects,
    setPlacedObjects,
    hoverVertex,
    rooms,   
    setSelectedRoom,
    selectedRoom,
    binderRef,binderVersion,nearNodePoint,
    wallLengthPopup,
  setWallLengthPopup,
  cancelWallLengthPopup,
  applyWallLength,
  };
}
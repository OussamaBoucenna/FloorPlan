import { useState, useRef, useEffect } from 'react';
import { calculateWallPolygon, computeWallAngle, findConnectedWalls, findWallAtPoint, nearWall, nearWallNode } from '../lib/walls';
import { middle, polygonize } from '../lib/qSvg';
import { almostEqual, nearVertex } from '../lib/helper';
import { calculateSnapPoint, findRoomAtPoint, getRoomCenter, isPointsEqual } from '../lib/utils';
import Obj2D from '../lib/editor';
import { displayMeasurements } from '../Draw';
export const useFloorPlanZones=(ctx,canvasRef,tool,onChangeTool)=>{
  const [walls,setWalls]=useState([])
  const [mode,setMode]=useState("select")
  const [modeOption,setModeOption]=useState("")
  const [placedObjects,setPlacedObjects]=useState([])
  const [isPreview,setIsPreview]=useState(true)
  const [roomProps,setRoomPropsPanel]=useState({})
  const binderRef = useRef(null)
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
  const [wallThickness, setWallThickness] = useState(12);
  const [roomData, setRoomData] = useState([]);
  
  
  console.log("wallls",walls,rooms)


    useEffect(() => {
      if (walls.length > 0 && (tool == "partition" || tool =="select")) {
        console.log("OUIIIIIIIIIIIII",tool,walls,selectedRoom)
        if(selectedRoom == null){
        const roomsResult = polygonize(walls);
        setRooms(roomsResult);
      }
      }
    }, [walls]);

    useEffect(()=>{
      // useEffect to update move Objects
      walls.forEach(wall => {
        // call updateWallObjects
        updateWallObjects(wall,wall)
      })
    },[walls])

    // draw Room function
    const drawRooms = (ctx, rooms) => {
      if (!rooms || !rooms.polygons) return;
      
      Object.entries(rooms.polygons).forEach(([index, room]) => {
        if (!room.coords || room.coords.length < 3) return;
        
        // Draw room polygon
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
        if (room.realArea) {
          const formattedArea = (room.realArea / 3600).toFixed(2) + " m²";
          ctx.font = '12px Arial';
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center';
          ctx.fillText(formattedArea, centerX, centerY + 10);
        }
        
        // Additionally show surface data if specified
        if (roomData[index]?.showSurface && roomData[index]?.surface) {
          ctx.fillText(roomData[index].surface, centerX, centerY + 30);
        }
      });
    };

    // draw Wall function 
    const drawWalls = (walls,ctx) => {
      walls.forEach(wall=>{
        const wallPolygon = calculateWallPolygon(wall.start, wall.end, wall.thickness);
      
        ctx.beginPath();
        ctx.moveTo(wallPolygon[0].x, wallPolygon[0].y);
        for(let i = 1; i < wallPolygon.length; i++) {
          ctx.lineTo(wallPolygon[i].x, wallPolygon[i].y);
        }
        ctx.closePath();
        
        //ctx.fillStyle = '#fff';
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
    ctx.fillText(`${(distance / 60).toFixed(2)} m`, midPoint.x, midPoint.y - 5);
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
    console.log(dragState,"drag")
    if (!dragState || !dragState.originalWalls) return;
  
    // compute your constrained deltas
    const deltaX = (point.x - dragState.startX) * 0.5;
    const deltaY = (point.y - dragState.startY) * 0.5;
  
    const newWalls = JSON.parse(JSON.stringify(walls))
    const selWall = newWalls[wallId];
    const origSelWall  = dragState.originalWalls[wallId];
    console.log("selWall",selWall)
    console.log("original wall",origSelWall)
    selWall.start.x = origSelWall.start.x + deltaX;
    selWall.start.y = origSelWall.start.y + deltaY;
    selWall.end.x   = origSelWall.end.x   + deltaX;
    selWall.end.y   = origSelWall.end.y   + deltaY;
      // move wall objects
    updateWallObjects(selWall,origSelWall,point)
  
    // Now handle connected walls exactly the same way:
    if (dragState.connectedWalls) {
        dragState.connectedWalls.forEach(({ wallId: connId }) => {
        if (connId === wallId) return;
        const connWall     = newWalls[connId];
        const origConnWall = dragState.originalWalls[connId];
        // move endpoints if they matched the selected wall’s endpoints
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
    // Use small movement factor if needed (0.5 = half speed, 1.0 = normal)
    const movementFactor = 1.0;
    const adjustedDeltaX = deltaX * movementFactor;
    const adjustedDeltaY = deltaY * movementFactor;
    
    // Create deep copies to avoid reference issues
    const newWalls = JSON.parse(JSON.stringify(walls));
    const newRooms = JSON.parse(JSON.stringify(rooms));
    
    console.log("dkhall hna",newRooms)
    // Find walls belonging to this room
    const wallsToMove = findWallsForRoom(roomId);
    
    // Move room coordinates
    for (let i = 0; i < newRooms.polygons[roomId].coords.length; i++) {
      newRooms.polygons[roomId].coords[i].x += adjustedDeltaX;
      newRooms.polygons[roomId].coords[i].y += adjustedDeltaY;
    }
    
    // Move inner rooms
    const innerRooms = newRooms.polygons[roomId].inside || [];
    for (const innerRoomId of innerRooms) {
      // Move inner room coordinates
      for (let i = 0; i < newRooms.polygons[innerRoomId].coords.length; i++) {
        newRooms.polygons[innerRoomId].coords[i].x += adjustedDeltaX;
        newRooms.polygons[innerRoomId].coords[i].y += adjustedDeltaY;
      }
      
      // Add inner room walls to move list
      const innerWalls = findWallsForRoom(innerRoomId);
      for (const wallIndex of innerWalls) {
        if (!wallsToMove.includes(wallIndex)) {
          wallsToMove.push(wallIndex);
        }
      }
    }
    
    // Move walls
    for (const wallIndex of wallsToMove) {
      // Move both endpoints
      newWalls[wallIndex].start.x += adjustedDeltaX;
      newWalls[wallIndex].start.y += adjustedDeltaY;
      newWalls[wallIndex].end.x += adjustedDeltaX;
      newWalls[wallIndex].end.y += adjustedDeltaY;
    }
    
    // Update state
    setWalls(newWalls);
    setRooms(newRooms);
  };


  const findWallsForRoom = (roomId) => {
    console.log("rooms",rooms,roomId)
    const roomCoords = rooms.polygons[roomId].coords;
    const wallIndices = [];
    
    // For each edge in the room polygon
    for (let i = 0; i < roomCoords.length - 1; i++) {
      const start = roomCoords[i];
      const end = roomCoords[i + 1];
      
      // Find matching wall
      for (let w = 0; w < walls.length; w++) {
        const wall = walls[w];
        
        // Check if this wall matches this edge (in either direction)
        if ((almostEqual(wall.start.x, start.x) && 
             almostEqual(wall.start.y, start.y) && 
             almostEqual(wall.end.x, end.x) && 
             almostEqual(wall.end.y, end.y)) ||
            (almostEqual(wall.start.x, end.x) && 
             almostEqual(wall.start.y, end.y) && 
             almostEqual(wall.end.x, start.x) && 
             almostEqual(wall.end.y, start.y))) {
          
          // Add to our list of walls if not already included
          if (!wallIndices.includes(w)) {
            console.log("dkhall hhhhhhh",w)
            wallIndices.push(w);
          }
          break;
        }
      }
    }
    return wallIndices;
  };
  

  const updateWallObjects=(wall,originWall,point)=>{
    const wallId = wall.wallId
    if(!placedObjects.some(obj => obj.wallId == wallId)) return
    //console.log("wallID connected is",wallId,placedObjects.filter(obj => obj.wallId == wallId))
   //const wall = walls[wallId]
   console.log("drag state",dragState)
   const originObject = (dragState && (dragState.type == "doorWindow" || dragState.type=="wall")) ? dragState.objects.filter(origin => origin.wallId == wallId) : null
   console.log("originObject",originObject) 
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
  

      // Calculate original wall length
      const origWallLength = Math.sqrt(
        origWallVector.x * origWallVector.x + 
        origWallVector.y * origWallVector.y
      );
      
      if(originObject){
        console.log("CALLED ",i,originObject,originWall)
      }
  
      // Calculate vector from wall start to object
      const objVector = {
        x: (originObject ?  originObject[i].x : obj.x) - originWall.start.x,
        y:   (originObject ?  originObject[i].y : obj.y) -  originWall.start.y
      };
  
      console.log("origWallVector",origWallVector)
      
      // Calculate relative position along wall (0 to 1)
      // Using dot product and projection
      const dotProduct = objVector.x * origWallVector.x + objVector.y * origWallVector.y;
      console.log("dotProduct",dotProduct,objVector,origWallLength)
      const relativePos = dotProduct / (origWallLength * origWallLength);
      
      // Store this for future use
      obj.relPos = relativePos;
      console.log("--61---",wall.start.x, relativePos , wallVector.x)
      console.log("---62---",wall.start.y ,relativePos ,wallVector.y)
  // Calculate new position using relative position
  obj.x = wall.start.x + relativePos * wallVector.x;
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


  // drag vertex logic 
  const handleVertexDrag = (point) => {
      if (!selectedVertex || !isDraggingVertex) return;
      // Horizontal/vertical snapping to connected walls
      connectedWalls.forEach(({ wall, isStart }) => {
        const oppositeEnd = isStart ? wall.end : wall.start;
        
        // Snap to horizontal alignment
        if (Math.abs(oppositeEnd.x - point.x) < 20) {
          point.x = oppositeEnd.x;
        }
        
        // Snap to vertical alignment
        if (Math.abs(oppositeEnd.y - point.y) < 20) {
          point.y = oppositeEnd.y;
        }
      });
      
      const newWalls = [...walls];
      
      // Update connected walls
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
      // Update states
      setWalls(newWalls);
      // update wall objects 
      newWalls.forEach(wall=>updateWallObjects(wall,wall,point))
     // setObjects(updatedObjects);
    };

      // update rooms after wall changes
  const updateRoomsForWalls=(currentWalls)=>{
    const roomsResult = polygonize(currentWalls);
  // Update rooms state
    setRooms(roomsResult);
  }

  const finishWall = () => {
    if (!startPoint || !currentPoint) return;
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - startPoint.x, 2) + 
      Math.pow(currentPoint.y - startPoint.y, 2)
    );
    
    // Only create walls of a meaningful length
    if (distance > 15) {
      const newWall = {
        start: { ...startPoint },
        end: { ...currentPoint },
        wallId : walls?.length, 
        thickness: tool === 'wall' ? wallThickness : 6
      };
      
      setWalls(prevWalls => [...prevWalls, newWall]);
      
      // In multi-mode, continue drawing from the current point
      if (isMultiMode) {
        setStartPoint(currentPoint);
      } else {
        setAction(0);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    } else {
      // Too short, cancel
      setAction(0);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleMouseDown = (event)=>{
    const point = getCanvasPoint(event);
        console.log("mode issssssss",tool,action)
        if (tool === 'select') {
          const vertex = nearVertex(walls,point,10)
          if(vertex){
            if(selectedRoom!=null) setSelectedRoom(null)
            setSelectedVertex(vertex)
            setConnectedWalls(vertex.walls)
            setIsDraggingVertex(true);
            return 
          }
          // move door || window objects
          const objectTarget = findObjectUnderCursor(point)
          if(objectTarget && (objectTarget.class == "doorWindow" || objectTarget.family == "inWall")){
            // set Drag State
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
            // Create or update the binder object for visual feedback
        if (!binderRef.current) {
          binderRef.current = objectTarget;
        }
        // change MODE
        onChangeTool("door_mode")
        setIsPreview(true)
        setBinderVersion(prev => prev + 1)
        return 
          }
          const wallInfo = nearWall(point, 6,walls);
          const {wall,wallId}=wallInfo
          console.log("from wall info hhhh",wallId,wall)
        if (wall) {
          if(selectedRoom!=null) setSelectedRoom(null)
        const connectedWalls= findConnectedWalls(walls,wallId);
      const wallIds = connectedWalls?.map(wall=>wall.wallId )
      console.log("connected walls ....",wallId)
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
        return 
      }else{
        console.log("dkhall hna rooms",rooms.length)
        if(rooms.polygons){   
        const roomId = findRoomAtPoint(rooms,point);
          if (roomId !== null) {
            // set selected the room
            setSelectedRoom(roomId)
            console.log("called here 22",rooms.polygons[roomId])
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
              lastX: point.x,  // Track last position for incremental movements
              lastY: point.y,
              // Store room center for more natural movement
              roomCenterX: getRoomCenter(rooms,roomId).x,
              roomCenterY: getRoomCenter(rooms,roomId).y
            });
          }
          }else{
              // Then check for wall selection
              const wallId = findWallAtPoint(point);
              console.log(wallId,"wallId")
              if (wallId !== null) {
                if(selectedRoom!=null) setSelectedRoom(null)
                // Start wall drag
                setDragState({
                  type: 'wall',
                  id: wallId,
                  startX: point.x,
                  startY: point.y,
                  origStart: {...walls[wallId].start},
                  origEnd: {...walls[wallId].end}
                });
                
                // Change cursor and highlight selected wall
                //setCursor('move');
                //highlightWall(wallId);
              }
          }}
        }else{
        
        if (tool !== 'wall' && tool !== 'partition') return;
        const snap = calculateSnapPoint(walls,point);
        
        if (action === 0) {
          console.log("dkhall hna salam ")
          // Start drawing a new wall
          setStartPoint(snap);
          setAction(1);
        } else {
          // Complete the current wall
          finishWall();
        }}
  }

  // mouse move function 
   const handleMouseMove = (event) => {
    console.log("caled rom mouse move ...",tool)
      if(tool!="door_mode"){
        binderRef.current
        =null
      }
      const point = getCanvasPoint(event);
      if (isDraggingVertex && selectedVertex) {
        // Handle vertex dragging - Step 5
        handleVertexDrag(point);
        return;
      }
        // mouse move without dragging 
        if(tool=="select"){
          console.log("select is .........",dragState,tool)
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
          // call update
          binderRef.current.update()
        }
      }
      if (dragState.type === 'wall') {
        handleWallMove(dragState.id,event);
      }
      }
      if ((tool === 'wall' || tool === 'partition') && action === 1) {
        // Check if near a wall node for connecting
        const point = getCanvasPoint(event);
        const nearNode = nearWallNode(walls,point);
        if (nearNode) {
          setCurrentPoint(nearNode);
          setNearNodePoint(nearNode);
        } else {
          const snap = calculateSnapPoint(walls,point);
          setCurrentPoint(snap);
          setNearNodePoint(null);
        }
      } else if (tool === "door_mode") {
        console.log("wachhhhhhhhhhhhhhhh door mode")
        const point = getCanvasPoint(event);
        // we need the wall *and* its index so we can update state immutably
        const wallSelect = nearWall(point, 10, walls);
        if (wallSelect) {
          const { wall, wallId } = wallSelect;
          setIsPreview(true)
          // only create one binder at a time
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
            console.log(wallSelect)
          const wall = wallSelect.wall;
          
          // Calculate the angle of the wall
          const {angle,angleSign} = computeWallAngle(
            wall,point
          );
          // Update door properties
          binderRef.current.wall = wall;
          binderRef.current.wallId = wallId;
         binderRef.current.x = wallSelect.x;
         binderRef.current.y = wallSelect.y;
         binderRef.current.angle = angle;
         binderRef.current.angleSign = angleSign;
         binderRef.current.thick = wall.thickness;
          // Update binderRef
          setBinderVersion(prev => prev +1)
         binderRef.current.update();
          }
        }
            
      } else{
        // Just update for hover effects
        const point = getCanvasPoint(event)
        const nearNode = nearWallNode(walls,point);
        setNearNodePoint(nearNode);
      }
    };

    // mouse up event 
    const handleMouseUp = (event) => {
      console.log("hnaaaaaaaaaaaaaa999",)
    if(tool=="select"){
      
      if (isDraggingVertex) {
        setIsDraggingVertex(false);
        // Finalize the move by recalculating rooms
        const updatedRooms = polygonize(walls);
        setRooms(updatedRooms);
        // Clear selection
        setSelectedVertex(null);
        setHoverVertex(null)
        setConnectedWalls([]);
      }
      
      if (!dragState) return;
       if (dragState.type === 'wall') {
      updateRoomsForWalls(walls);
    }
    setDragState(null)}
      else if ((tool === 'wall' || tool === 'partition') && action === 1) {
        finishWall();
      }else if(tool=="door_mode" && binderRef.current){
        console.log("Placing door permanently",binderRef.current)
        setPlacedObjects(prevObjects => [...prevObjects, new Object(binderRef.current)]);
        setIsPreview(false);
       onChangeTool("select");
        }
    };
  
    console.log(walls)
  
    const onCancelUpdate=()=>{
      setSelectedRoom(null)
      setRoomPropsPanel({...roomProps, visible:false})
    }
    
    
    const handleSelectDoorType=(type)=>{
      setMode("door_mode")
      setModeOption(type)
    }
    // Change mode
   

  

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
    wallThickness,
    walls,
    mode,
    placedObjects,
    hoverVertex,
    rooms,   
    setMode,
    setSelectedRoom,
    selectedRoom,
    binderRef,binderVersion,nearNodePoint

  };
}
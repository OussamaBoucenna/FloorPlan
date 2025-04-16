// src/components/FloorPlanEditor.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFloorPlanZones } from './hooks/useZonesEditor';
export const FloorPlanEditor = () => {
  const [roomPropsPanel, setRoomPropsPanel] = useState({
    visible: false,
    name: '',
    color: '#f0daaf',
    showSurface: false
  });
  //const [rooms, setRooms] = useState([{polygons:{}}]);
//  const [selectedObject, setSelectedObject] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  // import my hook 
  const {drawRooms,drawWall,setAction,handleSelectDoorType,setCurrentPoint,setIsMultiMode, setStartPoint, drawWallPreview,handleMouseDown,handleMouseMove,handleMouseUp, setSelectedRoom,setNearNodePoint,walls,setRooms,action,selectedVertex,isMultiMode, hoverVertex,wallThickness,isPreview,nearNodePoint,currentPoint,selectedRoom, startPoint,placedObjects,mode,rooms,setMode,binderRef,binderVersion} = useFloorPlanZones(ctxRef.current,canvasRef)
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    // Set initial canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    drawCanvas();
  }, []);

  // Draw canvas whenever state changes
  useEffect(() => {
    drawCanvas();
    if(binderRef.current && isPreview){
      binderRef.current.draw(ctxRef.current,true)
    }
  }, [walls, rooms, mode, action, startPoint, currentPoint, nearNodePoint,binderVersion,isPreview,placedObjects]);



  // Main drawing function
  const drawCanvas = /*useCallback(*/() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw existing walls
    walls.forEach(wall => {
      drawWall(ctx, wall);
    });
    
    drawRooms(ctx, rooms);
    /*if (selectedObject?.type === 'wall') {
      drawWall(ctx, selectedObject, true);
    }*/
      if(placedObjects && placedObjects.length){
        placedObjects.forEach(object => {
          object.draw(ctxRef.current)
        })
      }

    // Draw wall preview when in drawing mode
    if ((mode === 'line' || mode === 'partition') && action === 1 && startPoint && currentPoint) {
      drawWallPreview(ctx, startPoint, currentPoint, 
        mode === 'line' ? wallThickness : 10);
    }
    
    // Draw green circle indicator when near a wall node
    if (nearNodePoint && mode != "select") {
      ctx.beginPath();
      ctx.arc(nearNodePoint.x, nearNodePoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (hoverVertex) {
      ctx.beginPath();
      ctx.arc(hoverVertex.x, hoverVertex.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    if (selectedVertex) {
      ctx.beginPath();
      ctx.arc(selectedVertex.x, selectedVertex.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(92, 186, 121, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#5cba79';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }/*, [walls,rooms, mode, action,selectedVertex, startPoint, currentPoint, nearNodePoint, selectedObject, wallThickness]);*/

  const drawGrid = (ctx, width, height, spacing = 20) => {
    ctx.save();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  // Get canvas point from mouse event
  const onSaveRoomProps=useCallback((roomId,props)=>{
    console.log("called",roomId,props)
    if(!props) return;
    console.log(props)
    const roomData ={...rooms}
    roomData.polygons[roomId].name = props.name || roomData.polygons[roomId].name
    roomData.polygons[roomId].color = props.color || roomData.polygons[roomId].color
    // set rooms
    setRooms(roomData)
    console.log("to null")
    setSelectedRoom(null)
    setRoomPropsPanel({...roomPropsPanel, visible: false});
  },[roomPropsPanel])

  

  // Mouse down handler - Start drawing a wall
/*
  const handleMouseDown = (event) => {
    const point = getCanvasPoint(event);
    console.log("mode",mode)
    if (mode === 'select') {
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
    setMode("door_mode")
    setIsPreview(true)
    setBinderVersion(prev => prev + 1)
    return 
      }
      const wallInfo = nearWall(point, 6,walls);
      const {wall,wallId}=wallInfo
      console.log("from wall info hhhh",wallId,wall)
    if (wall) {
      if(selectedRoom!=null) setSelectedRoom(null)
    const connectedWalls= findConnectedWalls(wallId);
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
      const roomId = findRoomAtPoint(point);
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
          roomCenterX: getRoomCenter(roomId).x,
          roomCenterY: getRoomCenter(roomId).y
        });
        
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
    
    if (mode !== 'line' && mode !== 'partition') return;
    
    console.log("wach hhhh",action)
    const snap = calculateSnapPoint(walls,point);
    
    if (action === 0) {
      // Start drawing a new wall
      setStartPoint(snap);
      setAction(1);
    } else {
      // Complete the current wall
      finishWall();
    }}
  };
*/
//console.log("dragState",dragState)

  // Find walls connected to the selected wall

// Complete wall movement function with improved behavior



 

  

  // Add this function to identify walls belonging to a room

// Helper function to compare coordinates with tolerance



/*  const moveWall = (wallId, deltaX, deltaY) => {
    // Create new walls array to trigger re-render (immutability)
    let newWalls = [...walls];
    console.log("before",dragState)
    newWalls[wallId].start={
      x: dragState.origStart.x + deltaX,
      y: dragState.origStart.y + deltaY
    }
    newWalls[wallId].end={
      x: dragState.origEnd.x + deltaX,
      y: dragState.origEnd.y + deltaY
    }

    console.log("new wall",newWalls[wallId])
    // Update walls state
    setWalls([...newWalls]);
  };*/

  

 /* function wallGeometry(wall, positionAlongWall) {
    const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
    const pos = {
      x: wall.start.x + (wall.end.x - wall.start.x) * positionAlongWall,
      y: wall.start.y + (wall.end.y - wall.start.y) * positionAlongWall
    };
  
    return {
      position: pos,
      angle: angle * (180/Math.PI)
    };
  }*/

  

  // Mouse move handler - Update drawing preview
/*  const handleMouseMove = (event) => {
    if(mode!="door_mode"){
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
      if(mode=="select"){
        console.log("select is .........",dragState)
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
    if ((mode === 'line' || mode === 'partition') && action === 1) {
      // Check if near a wall node for connecting
      const point = getCanvasPoint(event);
      const nearNode = nearWallNode(point);
      if (nearNode) {
        setCurrentPoint(nearNode);
        setNearNodePoint(nearNode);
      } else {
        const snap = calculateSnapPoint(walls,point);
        setCurrentPoint(snap);
        setNearNodePoint(null);
      }
    } else if (mode === "door_mode") {
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
*/
  console.log(walls)
  
  const changeMode = (newMode) => {
    setMode(newMode);
    setAction(0);
    setStartPoint(null);
    setCurrentPoint(null);
    setNearNodePoint(null);
  };
  // Mouse up handler - Finalize wall
  
  
  return (
    <div className="floor-plan-editor">
      <div className=" flex gap-6">
        <button 
          className={mode === 'select' ? 'active' : ''} 
          onClick={() => changeMode('select')}
        >
          Select
        </button>
        <button 
          className={mode === 'line' ? 'active' : ''} 
          onClick={() => changeMode('line')}
        >
          Wall
        </button>
        <button 
          className={mode === 'partition' ? 'active' : ''} 
          onClick={() => changeMode('partition')}
        >
          Partition
        </button>
        
        <div className="tool-options">
          <label>
            <input 
              type="checkbox" 
              checked={isMultiMode} 
              onChange={(e) => setIsMultiMode(e.target.checked)} 
            />
            Multi-Wall Mode
          </label>
          <label>
            Wall Thickness:
            <input 
              type="range" 
              min="10" 
              max="30" 
              value={wallThickness} 
           //   onChange={(e) => setWallThickness(parseInt(e.target.value))} 
            />
            {wallThickness}
          </label>
        </div>
        <div className="toolbar">
      <button onClick={() => handleSelectDoorType('doorSingle')}>
        Single Door
      </button>
      <button onClick={() => handleSelectDoorType('windowSingle')}>
        Single Window
      </button>
    </div>
      </div>
      
      <div className="canvas-container relative h-800 w-800">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className=' absolute top-0 left-0 w-full'
          style={{ 
            cursor: 
              nearNodePoint ? 'grab' : 
              (mode === 'line' || mode === 'partition') ? 'crosshair' : 'default' 
          }}
        />
      </div>
      {/*
  <RoomPropertiesPanel
      roomId={selectedRoom}
      visible={roomPropsPanel.visible}
      onSave={onSaveRoomProps}
      roomProps={roomPropsPanel}
      onPropsChange={(props)=>setRoomPropsPanel({...roomPropsPanel,...props})}
      onCancel={onCancelUpdate}
      />*/}
    </div>
  );
};


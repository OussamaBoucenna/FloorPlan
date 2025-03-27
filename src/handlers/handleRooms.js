import {calculatePolygonArea, isNearPoint} from '../Utils';



export const handleRoom = (mousePos, currentRoom, setCurrentRoom, setRooms, setIsDrawing) => {
    if (currentRoom.length === 0 || !isNearPoint(mousePos, currentRoom[0])) {
        setCurrentRoom([...currentRoom, { x: mousePos.x, y: mousePos.y }]);
    } else {
        if (currentRoom.length >= 3) {
            setRooms(prevRooms => [...prevRooms, {
                id: Date.now(),
                points: [...currentRoom],
                area: calculatePolygonArea(currentRoom)
            }]);
        }
        setCurrentRoom([]);
        setIsDrawing(false);
    }
};


export const drawRooms = (ctx, rooms, selectedItem) => {
    rooms.forEach((room) => {
      ctx.fillStyle = "rgba(200, 200, 255, 0.3)";
      ctx.strokeStyle = "#0066ff";
      ctx.lineWidth = 2;
  
      ctx.beginPath();
      ctx.moveTo(room.points[0].x, room.points[0].y);
      room.points.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
  
      if (selectedItem && selectedItem.type === "room" && selectedItem.id === room.id) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

export const handleRoomDrawing = (mousePos, currentRoom, setCurrentRoom, setRooms, calculatePolygonArea, setIsDrawing, isNearPoint) => {
    if (currentRoom.length === 0 || !isNearPoint(mousePos, currentRoom[0])) {
        // Add a new point to the room
        setCurrentRoom([...currentRoom, { x: mousePos.x, y: mousePos.y }]);
    } else {
        // Close the room when it connects to the first point
        if (currentRoom.length >= 3) {
            setRooms(prev => [...prev, {
                id: Date.now(),
                points: [...currentRoom],
                area: calculatePolygonArea(currentRoom)
            }]);
        }
        setCurrentRoom([]);  // Reset for a new room
        setIsDrawing(false);  // Stop drawing mode
    }
};

export const drawCurrentRoom = (ctx, currentRoom, isDrawing) => {
  if (currentRoom.length === 0) return;
  
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(currentRoom[0].x, currentRoom[0].y);
  currentRoom.slice(1).forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });

  if (isDrawing) {
    const lastPoint = currentRoom[currentRoom.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
  } else {
    ctx.closePath();
  }

  ctx.stroke();
};



  
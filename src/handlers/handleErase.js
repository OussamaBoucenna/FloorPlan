

export const handleErase = (selectedItem, setWalls, setDoors, setRooms, setPois, walls, doors, rooms, pois, setSelectedItem) => {
  if (!selectedItem) return;

  if (selectedItem.type === 'wall') {
    setWalls(walls.filter(w => w.id !== selectedItem.id));
    setDoors(doors.filter(d => d.wallId !== selectedItem.id));
  } else if (selectedItem.type === 'room') {
    setRooms(rooms.filter(r => r.id !== selectedItem.id));
  } else if (selectedItem.type === 'poi') {
    setPois(pois.filter(o => o.id !== selectedItem.id));
  } else if (selectedItem.type === 'door') {
    setDoors(doors.filter(d => d.id !== selectedItem.id));
  }
  setSelectedItem(null);
};

  
export const handleDrawingStart = (tool, mousePos, setCurrentWall, setCurrentWindow, setCurrentRoom, currentRoom, isNearPoint) => {
  if (tool === 'window') {
    setCurrentWindow({
      id: Date.now(),
      start: { x: mousePos.x, y: mousePos.y },
      end: { x: mousePos.x, y: mousePos.y }
    });
  } else if (tool === 'wall') {
    setCurrentWall({
      id: Date.now(),
      start: { x: mousePos.x, y: mousePos.y },
      end: { x: mousePos.x, y: mousePos.y }
    });
  } else if (tool === 'room') {
    if (currentRoom.length === 0) {
      setCurrentRoom([{ x: mousePos.x, y: mousePos.y }]);
    } else {
      if (isNearPoint(mousePos, currentRoom[0])) return;
      setCurrentRoom([...currentRoom, { x: mousePos.x, y: mousePos.y }]);
    }
  }
};


export const handleDrawingEnd = (
  tool, 
  mousePos, 
  currentWall, setWalls, 
  currentWindow, setWindows, 
  currentRoom, setRooms, 
  calculatePolygonArea, 
  setCurrentRoom, setIsDrawing, 
  isNearPoint
) => {
  if (tool === 'window' && currentWindow) {
    setWindows(prev => [...prev, { ...currentWindow, end: { x: mousePos.x, y: mousePos.y } }]);
  } 
  else if (tool === 'wall' && currentWall) {
    setWalls(prev => [...prev, { ...currentWall, end: { x: mousePos.x, y: mousePos.y } }]);
  } 
  else if (tool === 'room') {
    if (currentRoom.length >= 3 && isNearPoint(mousePos, currentRoom[0])) {
      const newRoom = {
        id: Date.now(),
        points: [...currentRoom],
        area: calculatePolygonArea(currentRoom)
      };
      setRooms(prev => [...prev, newRoom]);
      setCurrentRoom([]);
      setIsDrawing(false);
    }
  }
};


export const isNearPoint = (point1, point2, threshold = 10) => {
  if (!point1 || !point2) return false;
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
};



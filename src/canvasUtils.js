export const findClickedObject = (pois, offsetX, offsetY) => {
    return pois.find(obj =>
      offsetX >= obj.x - 15 && offsetX <= obj.x + 15 &&
      offsetY >= obj.y - 15 && offsetY <= obj.y + 15
    );
  };
  
  export const getCanvasClickPosition = (canvas, e) => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  
  export const handlePathTool = (mousePos, pathPoints, setPathPoints, calculatePath, setCurrentPath) => {
    if (!pathPoints.start) {
      setPathPoints({ ...pathPoints, start: mousePos });
    } else if (!pathPoints.end) {
      setPathPoints({ ...pathPoints, end: mousePos });
      calculatePath(pathPoints.start, mousePos);
    } else {
      setPathPoints({ start: mousePos, end: null });
      setCurrentPath([]);
    }
  };
  
  export const handleEraseTool = (selectedItem, setWalls, setDoors, setRooms, setPois, setSelectedItem, walls, doors, rooms, pois) => {
    if (!selectedItem) return;
    switch (selectedItem.type) {
      case 'wall':
        setWalls(walls.filter(w => w.id !== selectedItem.id));
        setDoors(doors.filter(d => d.wallId !== selectedItem.id));
        break;
      case 'room':
        setRooms(rooms.filter(r => r.id !== selectedItem.id));
        break;
      case 'poi':
        setPois(pois.filter(o => o.id !== selectedItem.id));
        break;
      case 'door':
        setDoors(doors.filter(d => d.id !== selectedItem.id));
        break;
    }
    setSelectedItem(null);
  };

  export const updateCanvasSize = (canvasContainerRef, setCanvasSize) => {
    if (canvasContainerRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
  };
  
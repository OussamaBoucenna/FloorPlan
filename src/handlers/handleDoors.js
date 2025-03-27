import { calculateDoorPosition} from '../Utils';

export const handleDoorPlacement = (mousePos, selectedItem, walls, setDoors) => {
    if (selectedItem?.type === 'wall') {
        const wall = walls.find(w => w.id === selectedItem.id);
        if (wall) {
            const doorPosition = calculateDoorPosition(mousePos, wall);
            if (doorPosition) {
                setDoors(prevDoors => [...prevDoors, {
                    id: Date.now(),
                    start: doorPosition.start,
                    end: doorPosition.end,
                    wallId: wall.id
                }]);
            }
        }
    }
};

export const drawDoors = (ctx, doors, selectedItem) => {
    ctx.strokeStyle = "#8B4513";
  
    doors.forEach((door) => {
      ctx.beginPath();
      ctx.moveTo(door.start.x, door.start.y);
      ctx.lineTo(door.end.x, door.end.y);
      ctx.stroke();
  
      if (selectedItem && selectedItem.type === "door" && selectedItem.id === door.id) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 22;
        ctx.stroke();
      }
    });
  };

  export const handleDoor = (mousePos, selectedItem, walls, calculateDoorPosition, doors, setDoors) => {
    if (selectedItem?.type === 'wall') {
      const wall = walls.find(w => w.id === selectedItem.id);
      if (wall) {
        const doorPosition = calculateDoorPosition(mousePos, wall);
        if (doorPosition) {
          const newDoor = {
            id: Date.now(),
            start: doorPosition.start,
            end: doorPosition.end,
            wallId: wall.id
          };
          setDoors([...doors, newDoor]);
        }
      }
    }
  };
  
  
  
      
import {isInsidePolygon} from '../Utils'

const distanceToLine = (point, lineStart, lineEnd) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

const isNearLine = (point, lineStart, lineEnd) => {
  const distance = distanceToLine(point, lineStart, lineEnd);
  return distance < 15;
};

const findItemAt = (pos, pois) => {
  /*for (const door of doors) {
    if (isNearLine(pos, door.start, door.end)) {
      return { type: 'door', id: door.id };
    }
  }*/

  for (const obj of pois) {
    if (
      pos.x >= obj.x && pos.x <= obj.x + obj.width &&
      pos.y >= obj.y && pos.y <= obj.y + obj.height
    ) {
      return { type: 'poi', id: obj.id };
    }
  }
/*
  for (const wall of walls) {
    if (isNearLine(pos, wall.start, wall.end)) {
      return { type: 'wall', id: wall.id };
    }
  }

  for (const room of rooms) {
    if (isInsidePolygon(pos, room.points)) {
      return { type: 'room', id: room.id };
    }
  }*/

  return null;
};

export const handleSelect = (mousePos, setSelectedItem, doors, pois, walls, rooms) => {
  const item = findItemAt(mousePos, pois);
  setSelectedItem(item);
};

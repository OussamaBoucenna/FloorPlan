const getMousePos = (canvas, evt , offset , scale) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left - offset.x) / scale,
      y: (evt.clientY - rect.top - offset.y) / scale
    };
  };


const isNearPoint = (point1, point2, threshold = 10) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
};


  const isInsidePolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  };


  // Fonction pour trouver les cellules sur une ligne (algorithme de Bresenham)
const getCellsOnLine = (x0, y0, x1, y1) => {
    const cells = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
        cells.push({x: x0, y: y0});
        
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    
    return cells;
};


const calculateDoorPosition = (mousePos, wall) => {
    const wallLength = Math.sqrt(
      Math.pow(wall.end.x - wall.start.x, 2) + 
      Math.pow(wall.end.y - wall.start.y, 2)
    );
    
    const t = ((mousePos.x - wall.start.x) * (wall.end.x - wall.start.x) + 
               (mousePos.y - wall.start.y) * (wall.end.y - wall.start.y)) / 
              (wallLength * wallLength);
    
    if (t < 0.1 || t > 0.9) return null;
    
    const doorWidth = 40;
    const doorCenter = {
      x: wall.start.x + t * (wall.end.x - wall.start.x),
      y: wall.start.y + t * (wall.end.y - wall.start.y)
    };
    
    return {
      start: {
        x: doorCenter.x - (doorWidth / 2) * (wall.end.x - wall.start.x) / wallLength,
        y: doorCenter.y - (doorWidth / 2) * (wall.end.y - wall.start.y) / wallLength
      },
      end: {
        x: doorCenter.x + (doorWidth / 2) * (wall.end.x - wall.start.x) / wallLength,
        y: doorCenter.y + (doorWidth / 2) * (wall.end.y - wall.start.y) / wallLength
      }
    };
  };





  // FOR NAVIGATION 


  

const createGrid = (width, height, cellSize,walls,doors , bufferSize = 1) => {
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = [];
    
    // Initialiser toutes les cellules comme traversables
    for (let y = 0; y < rows; y++) {
        grid[y] = [];
        for (let x = 0; x < cols; x++) {
            grid[y][x] = {
                x: x * cellSize + cellSize/2,
                y: y * cellSize + cellSize/2,
                walkable: true,
                isDoor: false,
                isWall: false,
                isBuffer: false
            };
        }
    }
    
    // 1. Identifier d'abord les cellules de porte pour les protéger plus tard
    const doorCells = new Set(); // Utiliser un Set pour un accès rapide
    
    doors.forEach(door => {
        const cellsOnDoor = getCellsOnLine(
            Math.floor(door.start.x / cellSize), 
            Math.floor(door.start.y / cellSize),
            Math.floor(door.end.x / cellSize), 
            Math.floor(door.end.y / cellSize)
        );
        
        cellsOnDoor.forEach(cell => {
            if (cell.y >= 0 && cell.x >= 0 && cell.y < rows && cell.x < cols) {
                // Marquer cette cellule dans notre Set
                const key = `${cell.y},${cell.x}`;
                doorCells.add(key);
                
                // Mettre à jour la cellule
                grid[cell.y][cell.x].isDoor = true;
            }
        });
    });
    
    // 2. Marquer les murs
    walls.forEach(wall => {
        const cellsOnWall = getCellsOnLine(
            Math.floor(wall.start.x / cellSize), 
            Math.floor(wall.start.y / cellSize),
            Math.floor(wall.end.x / cellSize), 
            Math.floor(wall.end.y / cellSize)
        );
        
        cellsOnWall.forEach(cell => {
            if (cell.y >= 0 && cell.x >= 0 && cell.y < rows && cell.x < cols) {
                const key = `${cell.y},${cell.x}`;
                
                // Ne pas marquer comme mur si c'est une porte
                if (!doorCells.has(key)) {
                    grid[cell.y][cell.x].walkable = false;
                    grid[cell.y][cell.x].isWall = true;
                }
            }
        });
    });
    
    // 3. Ajouter une zone de sécurité autour des murs
    const wallCells = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x].isWall) {
                wallCells.push({y, x});
            }
        }
    }
    
    // Pour chaque cellule de mur, marquer les cellules adjacentes comme buffer
    wallCells.forEach(wallCell => {
        for (let dy = -bufferSize; dy <= bufferSize; dy++) {
            for (let dx = -bufferSize; dx <= bufferSize; dx++) {
                // Ne pas traiter la cellule du mur elle-même
                if (dx === 0 && dy === 0) continue;
                
                const ny = wallCell.y + dy;
                const nx = wallCell.x + dx;
                
                // Vérifier si la cellule est dans les limites
                if (ny >= 0 && nx >= 0 && ny < rows && nx < cols) {
                    const key = `${ny},${nx}`;
                    
                    // Ne pas mettre de buffer sur une porte
                    if (!doorCells.has(key) && !grid[ny][nx].isWall) {
                        grid[ny][nx].isBuffer = true;
                        grid[ny][nx].walkable = false;
                    }
                }
            }
        }
    });
    
    // 4. Finaliser les portes pour s'assurer qu'elles sont toujours traversables
    doorCells.forEach(key => {
        const [y, x] = key.split(',').map(Number);
        grid[y][x].walkable = true;
        grid[y][x].isDoor = true;
        grid[y][x].isWall = false;
        grid[y][x].isBuffer = false;
    });
    
    // Ajouter des logs pour le débogage
    console.log("Grille créée - Cellules non traversables:", grid.flat().filter(cell => !cell.walkable).length);
    console.log("Cellules de mur:", grid.flat().filter(cell => cell.isWall).length);
    console.log("Cellules de buffer:", grid.flat().filter(cell => cell.isBuffer).length);
    console.log("Cellules de porte:", grid.flat().filter(cell => cell.isDoor).length);
    
    return grid;
};

export const calculatePolygonArea = (points) => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};


export const snapToGrid = (point, gridSize = 10) => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
};

const findItemAt = (pos,doors,pois,zones,walls,rooms) => {
  for (const door of doors) {
    if (isNearLine(pos, door.start, door.end)) {
      return { type: "door", id: door.id };
    }
  }

  for (const obj of pois) {
    if (
      pos.x >= obj.x &&
      pos.x <= obj.x + obj.width &&
      pos.y >= obj.y &&
      pos.y <= obj.y + obj.height
    ) {
      return { type: "poi", id: obj.id };
    }
  }
  // Ajoutez ceci dans la fonction findItemAt
  for (const zone of zones) {
    if (zone.shapeType === "rectangle") {
      if (
        pos.x >= zone.x &&
        pos.x <= zone.x + zone.width &&
        pos.y >= zone.y &&
        pos.y <= zone.y + zone.height
      ) {
        return { type: "zone", id: zone.id };
      }
    } else if (zone.shapeType === "circle") {
      const dx = pos.x - zone.center.x;
      const dy = pos.y - zone.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= zone.radius) {
        return { type: "zone", id: zone.id };
      }
    } else if (zone.shapeType === "polygon") {
      if (isInsidePolygon(pos, zone.points)) {
        return { type: "zone", id: zone.id };
      }
    }
  }

  for (const wall of walls) {
    if (isNearLine(pos, wall.start, wall.end)) {
      return { type: "wall", id: wall.id };
    }
  }

  for (const room of rooms) {
    if (isInsidePolygon(pos, room.points)) {
      return { type: "room", id: room.id };
    }
  }

  return null;
};

const isNearLine = (point, lineStart, lineEnd) => {
  const distance = distanceToLine(point, lineStart, lineEnd);
  return distance < 15;
};

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


  export  {getMousePos , isNearPoint,isInsidePolygon , getCellsOnLine , calculateDoorPosition , createGrid,findItemAt, isNearLine,distanceToLine}
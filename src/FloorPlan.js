import React, { useState, useRef, useEffect } from 'react';

const FloorPlanDesigner = () => {
  const [tool, setTool] = useState('wall');
  const [walls, setWalls] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [objects, setObjects] = useState([]);
  const [doors, setDoors] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWall, setCurrentWall] = useState(null);
  const [currentRoom, setCurrentRoom] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [jsonData, setJsonData] = useState('');
  const [pathPoints, setPathPoints] = useState({ start: null, end: null });
  const [currentPath, setCurrentPath] = useState([]);

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    if (canvasContainerRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
  };
  const drawGrid = (ctx) => {
    const gridSize = 50;
    const gridColor = '#e0e0e0';
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    
    const startX = Math.floor(-offset.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / scale / gridSize) * gridSize;
    const endX = startX + canvasSize.width / scale + gridSize * 2;
    const endY = startY + canvasSize.height / scale + gridSize * 2;
    
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };
   
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    drawGrid(ctx);
    
    // Dessiner les murs
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#333';
    walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
      
      if (selectedItem && selectedItem.type === 'wall' && selectedItem.id === wall.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 22;
        ctx.stroke();
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#333';
      }
    });

    // Dessiner les portes
    ctx.lineWidth = 20;
    doors.forEach(door => {
      ctx.strokeStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(door.start.x, door.start.y);
      ctx.lineTo(door.end.x, door.end.y);
      ctx.stroke();

      if (selectedItem && selectedItem.type === 'door' && selectedItem.id === door.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 22;
        ctx.stroke();
      }
    });
    
    // Dessiner les pièces
    rooms.forEach(room => {
      ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(room.points[0].x, room.points[0].y);
      room.points.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      if (selectedItem && selectedItem.type === 'room' && selectedItem.id === room.id) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    
    // Dessiner les objets
    objects.forEach(obj => {
      ctx.fillStyle = obj.color || '#ff9966';
      ctx.strokeStyle = '#663300';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.rect(obj.x, obj.y, obj.width, obj.height);
      ctx.fill();
      ctx.stroke();
      
      if (selectedItem && selectedItem.type === 'object' && selectedItem.id === obj.id) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    // Dessiner les points de navigation
    if (pathPoints.start) {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(pathPoints.start.x, pathPoints.start.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (pathPoints.end) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(pathPoints.end.x, pathPoints.end.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dessiner le chemin calculé
    if (currentPath.length > 1) {
        console.log("Current path reho ktermn 1 : **************************************************************************************************************", currentPath);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    
    if (isDrawing && currentWall) {
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(currentWall.start.x, currentWall.start.y);
      ctx.lineTo(currentWall.end.x, currentWall.end.y);
      ctx.stroke();
    }
    
    if (tool === 'room' && currentRoom.length > 0) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentRoom[0].x, currentRoom[0].y);
      currentRoom.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      if (isDrawing) {
        const lastPoint = currentRoom[currentRoom.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      } else {
        ctx.closePath();
      }
      ctx.stroke();
    }
    
    ctx.restore();
  }, [walls, rooms, objects, doors, currentWall, currentRoom, isDrawing, scale, offset, selectedItem, pathPoints, currentPath, drawGrid, tool]);

 

  const getMousePos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left - offset.x) / scale,
      y: (evt.clientY - rect.top - offset.y) / scale
    };
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);
    
    if (e.button === 1 || (e.button === 0 && tool === 'pan')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    if (tool === 'path') {
      if (!pathPoints.start) {
        setPathPoints({ ...pathPoints, start: mousePos });
      } else if (!pathPoints.end) {
        setPathPoints({ ...pathPoints, end: mousePos });
        calculatePath(pathPoints.start, mousePos);
      } else {
        setPathPoints({ start: mousePos, end: null });
        setCurrentPath([]);
      }
      return;
    }
    
    if (tool === 'select') {
      const item = findItemAt(mousePos);
      setSelectedItem(item);
      return;
    }

    if (tool === 'door' && selectedItem?.type === 'wall') {
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
      return;
    }
    
    setIsDrawing(true);
    
    if (tool === 'wall') {
      setCurrentWall({
        id: Date.now(),
        start: { x: mousePos.x, y: mousePos.y },
        end: { x: mousePos.x, y: mousePos.y }
      });
    } else if (tool === 'room') {
      if (currentRoom.length === 0 || !isNearPoint(mousePos, currentRoom[0])) {
        setCurrentRoom([...currentRoom, { x: mousePos.x, y: mousePos.y }]);
      } else {
        if (currentRoom.length >= 3) {
          setRooms([...rooms, {
            id: Date.now(),
            points: [...currentRoom],
            area: calculatePolygonArea(currentRoom)
          }]);
        }
        setCurrentRoom([]);
        setIsDrawing(false);
      }
    } else if (tool === 'object') {
      const newObj = {
        id: Date.now(),
        x: mousePos.x,
        y: mousePos.y,
        width: 50,
        height: 50,
        type: 'rectangle',
        color: '#ff9966'
      };
      setObjects([...objects, newObj]);
      setIsDrawing(false);
    } else if (tool === 'erase' && selectedItem) {
      if (selectedItem.type === 'wall') {
        setWalls(walls.filter(w => w.id !== selectedItem.id));
        setDoors(doors.filter(d => d.wallId !== selectedItem.id));
      } else if (selectedItem.type === 'room') {
        setRooms(rooms.filter(r => r.id !== selectedItem.id));
      } else if (selectedItem.type === 'object') {
        setObjects(objects.filter(o => o.id !== selectedItem.id));
      } else if (selectedItem.type === 'door') {
        setDoors(doors.filter(d => d.id !== selectedItem.id));
      }
      setSelectedItem(null);
    }
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



const calculatePath = (start, end) => {
    if (!start || !end) {
        console.warn("Les points de départ ou d'arrivée sont invalides :", start, end);
        return;
    }

    // Définir la taille des cellules de la grille (à ajuster selon vos besoins)
    const cellSize = 10; // Par exemple, 20 pixels par cellule
    
    // Récupérer les dimensions de votre espace
    const width = 1500; // À remplacer par la largeur de votre plan
    const height = 1500; // À remplacer par la hauteur de votre plan
    
    // Créer la grille
    const grid = createGrid(width, height, cellSize);
    console.log("Grid created with dimensions:", grid.length, "rows ×", grid[0].length, "columns");
    
    // Trouver le chemin entre les points de départ et d'arrivée
    const path = findPath(start.x, start.y, end.x, end.y, grid, cellSize);
    console.log("Path found:", path);
    
    if (path && path.length > 0) {
        // Lisser le chemin si nécessaire
        const smoothPath = smoothPathPoints(path,grid,cellSize);
        setCurrentPath(smoothPath);
    } else {
        console.warn("Aucun chemin trouvé entre les points :", start, end);
        setCurrentPath([]);
    }
};


// Modifions la fonction createGrid pour ajouter une zone de sécurité autour des murs
const createGrid = (width, height, cellSize, bufferSize = 1) => {
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
    
    // Marquer les murs
    walls.forEach(wall => {
        // Tracer une ligne entre le début et la fin du mur
        const cellsOnWall = getCellsOnLine(
            Math.floor(wall.start.x / cellSize), 
            Math.floor(wall.start.y / cellSize),
            Math.floor(wall.end.x / cellSize), 
            Math.floor(wall.end.y / cellSize)
        );
        
        cellsOnWall.forEach(cell => {
            if (cell.y >= 0 && cell.x >= 0 && cell.y < rows && cell.x < cols) {
                grid[cell.y][cell.x].walkable = false;
                grid[cell.y][cell.x].isWall = true;
            }
        });
    });
    
    // Ajouter une zone de sécurité autour des murs
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
                    // Ne pas écraser les murs existants
                    if (!grid[ny][nx].isWall) {
                        grid[ny][nx].isBuffer = true;
                        grid[ny][nx].walkable = false;
                    }
                }
            }
        }
    });
    
    // Marquer les portes (après avoir mis les buffers pour s'assurer que les portes restent traversables)
    doors.forEach(door => {
        const cellsOnDoor = getCellsOnLine(
            Math.floor(door.start.x / cellSize), 
            Math.floor(door.start.y / cellSize),
            Math.floor(door.end.x / cellSize), 
            Math.floor(door.end.y / cellSize)
        );
        
        cellsOnDoor.forEach(cell => {
            if (cell.y >= 0 && cell.x >= 0 && cell.y < rows && cell.x < cols) {
                grid[cell.y][cell.x].walkable = true;
                grid[cell.y][cell.x].isDoor = true;
                grid[cell.y][cell.x].isWall = false;
                grid[cell.y][cell.x].isBuffer = false;
            }
        });
    });
    
    return grid;
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

// Fonction de recherche de chemin adaptée à la grille
const findPath = (startX, startY, endX, endY, grid, cellSize) => {
    // Convertir coordonnées réelles en indices de cellule
    const startCol = Math.floor(startX / cellSize);
    const startRow = Math.floor(startY / cellSize);
    const endCol = Math.floor(endX / cellSize);
    const endRow = Math.floor(endY / cellSize);
    
    // Vérifier si les points de départ et d'arrivée sont dans des zones traversables
    if (startRow < 0 || startCol < 0 || startRow >= grid.length || startCol >= grid[0].length ||
        endRow < 0 || endCol < 0 || endRow >= grid.length || endCol >= grid[0].length ||
        !grid[startRow][startCol].walkable || !grid[endRow][endCol].walkable) {
        console.warn("Points de départ ou d'arrivée dans une zone non traversable");
        return [];
    }
    
    // Initialiser les structures pour A*
    const openSet = [{row: startRow, col: startCol, f: 0, g: 0, h: 0}];
    const closedSet = [];
    const cameFrom = {};
    
    while (openSet.length > 0) {
        // Trouver le nœud avec le score F le plus bas
        let currentIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        const current = openSet[currentIndex];
        
        // Si on a atteint la destination
        if (current.row === endRow && current.col === endCol) {
            const path = [];
            let curr = current;
            
            // Reconstruire le chemin
            while (cameFrom[`${curr.row},${curr.col}`]) {
                // Ajouter le point actuel au chemin
                path.push({
                    x: curr.col * cellSize + cellSize/2,
                    y: curr.row * cellSize + cellSize/2
                });
                // Passer au point précédent
                curr = cameFrom[`${curr.row},${curr.col}`];
            }
            
            // Ajouter le point de départ
            path.push({
                x: startCol * cellSize + cellSize/2,
                y: startRow * cellSize + cellSize/2
            });
            
            return path.reverse();
        }
        
        // Retirer le nœud courant de openSet et l'ajouter à closedSet
        openSet.splice(currentIndex, 1);
        closedSet.push(current);
        
        // Vérifier les voisins (4 directions - Nord, Sud, Est, Ouest)
        const directions = [
            {row: -1, col: 0},  // Nord
            {row: 1, col: 0},   // Sud
            {row: 0, col: -1},  // Ouest
            {row: 0, col: 1},   // Est
            // Décommentez pour permettre les mouvements en diagonale
            {row: -1, col: -1}, // Nord-Ouest
            {row: -1, col: 1},  // Nord-Est
            {row: 1, col: -1},  // Sud-Ouest
            {row: 1, col: 1}    // Sud-Est
        ];
        
        for (const dir of directions) {
            const neighborRow = current.row + dir.row;
            const neighborCol = current.col + dir.col;
            const key = `${neighborRow},${neighborCol}`;
            
            // Vérifier si la cellule voisine est valide
            if (
                neighborRow < 0 || 
                neighborCol < 0 || 
                neighborRow >= grid.length || 
                neighborCol >= grid[0].length ||
                !grid[neighborRow][neighborCol].walkable ||
                closedSet.some(n => n.row === neighborRow && n.col === neighborCol)
            ) {
                continue;
            }
            
            // Calculer le nouveau score G
            const gScore = current.g + 1;
            
            // Vérifier si le voisin est déjà dans openSet
            const openNeighbor = openSet.find(n => n.row === neighborRow && n.col === neighborCol);
            
            if (!openNeighbor || gScore < openNeighbor.g) {
                // Calculer les scores
                const h = Math.abs(neighborRow - endRow) + Math.abs(neighborCol - endCol);
                const f = gScore + h;
                
                if (!openNeighbor) {
                    openSet.push({row: neighborRow, col: neighborCol, f, g: gScore, h});
                } else {
                    openNeighbor.f = f;
                    openNeighbor.g = gScore;
                    openNeighbor.h = h;
                }
                
                cameFrom[key] = current;
            }
        }
    }
    
    // Aucun chemin trouvé
    return [];
};

// Fonction pour lisser le chemin
const smoothPathPoints = (path,grid,cellSize) => {
    if (path.length <= 2) return path;
    
    const smoothedPath = [path[0]];
    let currentPoint = path[0];
    let i = 1;
    
    while (i < path.length - 1) {
        const nextPoint = path[i];
        const afterNextPoint = path[i + 1];
        
        // Si la ligne entre le point actuel et le point d'après-prochain est libre d'obstacles
        if (isLineClear(currentPoint, afterNextPoint,grid,cellSize)) {
            // Sauter le point intermédiaire
            i += 2;
        } else {
            // Ajouter le point intermédiaire et avancer
            smoothedPath.push(nextPoint);
            currentPoint = nextPoint;
            i += 1;
        }
    }
    
    // Ajouter le dernier point s'il reste
    if (i < path.length) {
        smoothedPath.push(path[path.length - 1]);
    }
    
    return smoothedPath;
};

// Fonction pour vérifier si une ligne entre deux points est libre d'obstacles
const isLineClear = (point1, point2,grid,cellSize) => {
    // Obtenir les cellules sur la ligne
    const cellsOnLine = getCellsOnLine(
        Math.floor(point1.x / cellSize),
        Math.floor(point1.y / cellSize),
        Math.floor(point2.x / cellSize),
        Math.floor(point2.y / cellSize)
    );
    
    // Vérifier que toutes les cellules sont traversables
    for (const cell of cellsOnLine) {
        if (cell.y >= 0 && cell.x >= 0 && cell.y < grid.length && cell.x < grid[0].length) {
            if (!grid[cell.y][cell.x].walkable) {
                return false;
            }
        }
    }
    
    return true;
};
















  const heuristic = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };

  const reconstructPath = (cameFrom, current) => {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }
    return path;
  };
  const canConnectThroughDoor = (node1, node2) => {
    if (node1.isDoor && node2.isDoor) return false;
    
    const doorNode = node1.isDoor ? node1 : node2;
    const otherNode = node1.isDoor ? node2 : node1;
    
    const maxDoorConnectionDistance = 100;
    const distance = Math.sqrt(
      Math.pow(doorNode.x - otherNode.x, 2) + 
      Math.pow(doorNode.y - otherNode.y, 2)
    );
    
    if (distance > maxDoorConnectionDistance) return false;
    
    for (const wall of walls) {
      if (doLinesIntersect(
        { start: doorNode, end: otherNode },
        wall
      )) {
        return false;
      }
    }
    
    return true;
  };


  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);
    
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }
    
    if (!isDrawing) return;
    
    if (tool === 'wall' && currentWall) {
      setCurrentWall({
        ...currentWall,
        end: { x: mousePos.x, y: mousePos.y }
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    
    if (!isDrawing) return;
    
    if (tool === 'wall' && currentWall) {
      const dx = currentWall.end.x - currentWall.start.x;
      const dy = currentWall.end.y - currentWall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 10) {
        setWalls([...walls, { ...currentWall }]);
      }
      
      setCurrentWall(null);
    }
    
    setIsDrawing(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const canvas = canvasRef.current;
    const mousePos = getMousePos(canvas, e);
    
    const newScale = scale * delta;
    if (newScale >= 0.1 && newScale <= 10) {
      const newOffset = {
        x: offset.x - (mousePos.x * scale - mousePos.x * newScale),
        y: offset.y - (mousePos.y * scale - mousePos.y * newScale)
      };
      
      setScale(newScale);
      setOffset(newOffset);
    }
  };

  const findItemAt = (pos) => {
    for (const door of doors) {
      if (isNearLine(pos, door.start, door.end)) {
        return { type: 'door', id: door.id };
      }
    }

    for (const obj of objects) {
      if (
        pos.x >= obj.x && pos.x <= obj.x + obj.width &&
        pos.y >= obj.y && pos.y <= obj.y + obj.height
      ) {
        return { type: 'object', id: obj.id };
      }
    }
    
    for (const wall of walls) {
      if (isNearLine(pos, wall.start, wall.end)) {
        return { type: 'wall', id: wall.id };
      }
    }
    
    for (const room of rooms) {
      if (isInsidePolygon(pos, room.points)) {
        return { type: 'room', id: room.id };
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

  const isNearPoint = (point1, point2, tolerance = 15) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  };

  const doLinesIntersect = (line1, line2) => {
    const x1 = line1.start.x;
    const y1 = line1.start.y;
    const x2 = line1.end.x;
    const y2 = line1.end.y;
    const x3 = line2.start.x;
    const y3 = line2.start.y;
    const x4 = line2.end.x;
    const y4 = line2.end.y;
    
    const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
    if (denominator === 0) return false;
    
    const t = (((x3 - x1) * (y4 - y3)) - ((y3 - y1) * (x4 - x3))) / denominator;
    const u = -(((x2 - x1) * (y3 - y1)) - ((y2 - y1) * (x3 - x1))) / denominator;
    
    return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
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

  const calculatePolygonArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const saveToJson = () => {
    const data = {
      objData: objects,
      wallData: walls,
      roomData: rooms,
      doorData: doors
    };
    
    setJsonData(JSON.stringify(data, null, 2));
  };

  const loadFromJson = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.wallData) setWalls(data.wallData);
      if (data.roomData) setRooms(data.roomData);
      if (data.objData) setObjects(data.objData);
      if (data.doorData) setDoors(data.doorData);
      setPathPoints({ start: null, end: null });
      setCurrentPath([]);
    } catch (e) {
      alert('Erreur lors du chargement des données: ' + e.message);
    }
  };

  const exportData = () => {
    const data = {
      objData: objects,
      wallData: walls,
      roomData: rooms,
      doorData: doors
    };
    
    const jsonStr = JSON.stringify(data);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor-plan.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        loadFromJson(event.target.result);
      } catch (e) {
        alert('Erreur lors de l\'importation du fichier: ' + e.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-100 p-4 border-b flex items-center gap-2">
        <h1 className="text-xl font-bold">Dessinateur de Plan d'Intérieur</h1>
        <div className="flex ml-auto gap-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if (confirm('Voulez-vous créer un nouveau projet? Toutes les modifications non sauvegardées seront perdues.')) {
                setWalls([]);
                setRooms([]);
                setObjects([]);
                setDoors([]);
                setCurrentRoom([]);
                setCurrentWall(null);
                setSelectedItem(null);
                setPathPoints({ start: null, end: null });
                setCurrentPath([]);
              }
            }}
          >
            Nouveau
          </button>
          <button 
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={exportData}
          >
            Exporter
          </button>
          <input
            type="file"
            id="fileInput"
            accept=".json"
            className="hidden"
            onChange={importData}
          />
          <button 
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => document.getElementById('fileInput').click()}
          >
            Importer
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-gray-50 p-4 border-r flex flex-col">
          <h2 className="font-bold mb-2">Outils</h2>
          <div className="space-y-2 mb-4">
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('wall')}
            >
              Mur
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'door' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('door')}
            >
              Porte
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'room' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('room')}
            >
              Pièce
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'object' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('object')}
            >
              Objet
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'path' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => {
                setTool('path');
                setPathPoints({ start: null, end: null });
                setCurrentPath([]);
              }}
            >
              Navigation
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('select')}
            >
              Sélectionner
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'erase' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('erase')}
            >
              Effacer
            </button>
            <button
              className={`w-full px-3 py-2 rounded ${tool === 'pan' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setTool('pan')}
            >
              Déplacer
            </button>
          </div>

          <h2 className="font-bold mb-2">Zoom</h2>
          <div className="flex justify-between mb-4">
            <button 
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => setScale(Math.max(0.1, scale / 1.2))}
            >
              -
            </button>
            <span className="px-2">{Math.round(scale * 100)}%</span>
            <button 
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => setScale(Math.min(10, scale * 1.2))}
            >
              +
            </button>
          </div>

          <button 
            className="w-full px-3 py-2 mt-auto bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={saveToJson}
          >
            Générer JSON
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div 
            ref={canvasContainerRef} 
            className="flex-1 overflow-hidden relative"
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          <div className="h-48 bg-gray-100 border-t p-4 overflow-auto">
            <h2 className="font-bold mb-2">Données JSON</h2>
            <textarea
              className="w-full h-32 p-2 border rounded font-mono text-sm"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Les données JSON apparaîtront ici après avoir cliqué sur 'Générer JSON'"
            />
            <div className="flex justify-end mt-2">
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => loadFromJson(jsonData)}
                disabled={!jsonData}
              >
                Charger ce JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanDesigner;
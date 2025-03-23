import React, { useState, useRef, useEffect } from 'react';

const FloorPlanV4 = () => {
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
  const [windows, setWindows] = useState([]);
  const [currentWindow, setCurrentWindow] = useState(null);






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
      displayMeasurements(ctx, wall.start, wall.end);
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
    
    // Dessiner les fenêtres
    windows.forEach(window => {
      // Dessiner la ligne de base de la fenêtre
      ctx.strokeStyle = '#4682B4'; // Couleur bleue pour les fenêtres
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(window.start.x, window.start.y);
      ctx.lineTo(window.end.x, window.end.y);
      ctx.stroke();
      
      // Ajouter des hachures pour distinguer les fenêtres des portes
      const dx = window.end.x - window.start.x;
      const dy = window.end.y - window.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        const nx = -dy / length * 10; // Vecteur normal (perpendiculaire) avec longueur 10
        const ny = dx / length * 10;
        
        // Dessiner plusieurs lignes perpendiculaires pour représenter le verre
        ctx.strokeStyle = '#FFFFFF'; // Lignes blanches pour le verre
        ctx.lineWidth = 3;
        
        const segments = 5; // Nombre de segments de hachures
        for (let i = 1; i <= segments; i++) {
          const t = i / (segments + 1);
          const px = window.start.x + dx * t;
          const py = window.start.y + dy * t;
          
          ctx.beginPath();
          ctx.moveTo(px - nx, py - ny);
          ctx.lineTo(px + nx, py + ny);
          ctx.stroke();
        }
      }
      
      // Mise en évidence si sélectionnée
      if (selectedItem && selectedItem.type === 'window' && selectedItem.id === window.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(window.start.x, window.start.y);
        ctx.lineTo(window.end.x, window.end.y);
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
    
    // Dessiner la fenêtre en cours de création
    if (isDrawing && currentWindow) {
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#4682B4'; // Couleur bleue pour les fenêtres
      ctx.beginPath();
      ctx.moveTo(currentWindow.start.x, currentWindow.start.y);
      ctx.lineTo(currentWindow.end.x, currentWindow.end.y);
      ctx.stroke();
      
      // Afficher les dimensions pendant le dessin
      displayMeasurements(ctx, currentWindow.start, currentWindow.end);
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
  }, [walls, rooms, objects, doors, windows, currentWall, currentWindow, currentRoom, isDrawing, scale, offset, selectedItem, pathPoints, currentPath, drawGrid, tool]);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (tool === "select" && (event.key === "Delete" || event.key === "Backspace")) {
        if (!selectedItem) return; // Prevents the error when selectedItem is null
  
        if (selectedItem.type === "wall") {
          setWalls(walls.filter((w) => w.id !== selectedItem.id));
          setDoors(doors.filter((d) => d.wallId !== selectedItem.id));
        } else if (selectedItem.type === "room") {
          setRooms(rooms.filter((r) => r.id !== selectedItem.id));
        } else if (selectedItem.type === "object") {
          setObjects(objects.filter((o) => o.id !== selectedItem.id));
        } else if (selectedItem.type === "door") {
          setDoors(doors.filter((d) => d.id !== selectedItem.id));
        }
  
        setSelectedItem(null);
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedItem, walls, doors, rooms, objects]);
 

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
    if (tool === 'window') {
        setCurrentWindow({
          id: Date.now(),
          start: { x: mousePos.x, y: mousePos.y },
          end: { x: mousePos.x, y: mousePos.y }
        });
      }else if (tool === 'wall') {
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
        // const smoothPath = smoothPathPoints(path,grid,cellSize);
        // console.log("Smoothed path: ----------->>>>>>>", smoothPath);
        setCurrentPath(path);
    } else {
        console.warn("Aucun chemin trouvé entre les points :", start, end);
        setCurrentPath([]);
    }
};














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
console.log("Calcul du chemin de (x,y)={", startX,",",startY, "} à (x,y)= {", endX,",",endY, "}");
console.log("Taille de cellule:", cellSize);
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

    
      const ctx = canvas.getContext('2d');
      // Redessiner pour effacer l'ancien texte (vous pouvez appeler votre fonction de rendu ici)
      // ...
      
      // Afficher la dimension du mur en cours de dessin
      displayMeasurements(ctx, currentWall.start, { x: mousePos.x, y: mousePos.y });
    }

    if (tool === 'window' && currentWindow) {
        setCurrentWindow({
          ...currentWindow,
          end: { x: mousePos.x, y: mousePos.y }
        });
         // Si vous souhaitez afficher les dimensions comme pour les murs
  const ctx = canvas.getContext('2d');
  displayMeasurements(ctx, currentWindow.start, { x: mousePos.x, y: mousePos.y });
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
    }else if (tool === 'window' && currentWindow) {
        const dx = currentWindow.end.x - currentWindow.start.x;
        const dy = currentWindow.end.y - currentWindow.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 10) { // Vérifier que la fenêtre a une taille minimale
          setWindows([...windows, { 
            ...currentWindow,
            // Vous pouvez ajouter d'autres propriétés ici
            type: 'window' 
          }]);
        }
        
        setCurrentWindow(null);
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


  const exportToGeoJSON = () => {
    // Create the base GeoJSON structure
    const geoJSONData = {
      "type": "FeatureCollection",
      "features": []
    };
  
    // Process and group walls by roomId to create room features
    const wallsByRoom = {};
    
    // Group walls by roomId
    walls.forEach(wall => {
      if (wall.roomId) {
        if (!wallsByRoom[wall.roomId]) {
          wallsByRoom[wall.roomId] = [];
        }
        wallsByRoom[wall.roomId].push(wall);
      }
    });
  
    // Create room features from grouped walls
    Object.keys(wallsByRoom).forEach((roomId, index) => {
      const roomWalls = wallsByRoom[roomId];
      
      // Sort walls to form a continuous polygon
      // This assumes walls are connected end-to-start
      let sortedWalls = [];
      let currentWall = roomWalls[0];
      sortedWalls.push(currentWall);
      
      // Simple algorithm to try to order walls
      let remainingWalls = [...roomWalls.slice(1)];
      while (remainingWalls.length > 0) {
        const endPoint = currentWall.end;
        const nextWallIndex = remainingWalls.findIndex(w => 
          (Math.abs(w.start.x - endPoint.x) < 0.1 && Math.abs(w.start.y - endPoint.y) < 0.1) ||
          (Math.abs(w.end.x - endPoint.x) < 0.1 && Math.abs(w.end.y - endPoint.y) < 0.1)
        );
        
        if (nextWallIndex === -1) break; // Can't find a connecting wall
        
        currentWall = remainingWalls[nextWallIndex];
        // Ensure the wall direction is consistent
        if (Math.abs(currentWall.end.x - endPoint.x) < 0.1 && Math.abs(currentWall.end.y - endPoint.y) < 0.1) {
          // Need to reverse the wall
          const temp = currentWall.start;
          currentWall.start = currentWall.end;
          currentWall.end = temp;
        }
        
        sortedWalls.push(currentWall);
        remainingWalls.splice(nextWallIndex, 1);
      }
  
      // Extract polygon coordinates from sorted walls
      const polygonCoords = sortedWalls.map(wall => [wall.start.x, wall.start.y]);
      // Close the polygon by adding the first point again
      polygonCoords.push([sortedWalls[0].start.x, sortedWalls[0].start.y]);
      
      // Calculate the bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      polygonCoords.forEach(coord => {
        minX = Math.min(minX, coord[0]);
        minY = Math.min(minY, coord[1]);
        maxX = Math.max(maxX, coord[0]);
        maxY = Math.max(maxY, coord[1]);
      });
      
      // Create the room feature
      const roomFeature = {
        "type": "Feature",
        "id": parseInt(roomId),
        "geometry": {
          "type": "Polygon",
          "coordinates": [polygonCoords]
        },
        "properties": {
          "class_id": 3,
          "class_name": "room",
          "confidence": 0.95, // Default confidence
          "x1": minX,
          "y1": minY,
          "x2": maxX,
          "y2": maxY,
          "width": maxX - minX,
          "height": maxY - minY,
          "area": (maxX - minX) * (maxY - minY)
        }
      };
      
      geoJSONData.features.push(roomFeature);
    });
  
    // Add individual walls that are not associated with rooms
    walls.filter(wall => !wall.roomId).forEach((wall, index) => {
      const wallFeature = {
        "type": "Feature",
        "id": 1000 + index, // Use a high number to avoid ID collisions
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [wall.start.x, wall.start.y],
            [wall.end.x, wall.end.y]
          ]
        },
        "properties": {
          "class_id": 1,
          "class_name": "wall",
          "width": wall.width || 1,
          "id": wall.id
        }
      };
      geoJSONData.features.push(wallFeature);
    });
  
    // Add doors if present
    if (doors && doors.length > 0) {
      doors.forEach((door, index) => {
        const doorFeature = {
          "type": "Feature",
          "id": 2000 + index, // Use a high number to avoid ID collisions
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [door.start.x, door.start.y],
              [door.end.x, door.end.y]
            ]
          },
          "properties": {
            "class_id": 2,
            "class_name": "door",
            "width": door.width || 2,
            "id": door.id
          }
        };
        geoJSONData.features.push(doorFeature);
      });
    }
  
    // Create and download the GeoJSON file
    const jsonStr = JSON.stringify(geoJSONData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor-plan.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("GeoJSON exported successfully");
    return true;
  };






  const initializeFloorPlanFromGeoJSON = (geoJSONData) => {
    const newWalls = [];
    const newRooms = [];
    const newDoors = [];
    const newWindows = [];
    let imageInfo = null;
    
    // Parcourir toutes les features du GeoJSON
    geoJSONData.features.forEach(feature => {
      // Si c'est une limite d'image
      if (feature.properties.type === "ImageBoundary") {
        imageInfo = {
          width: feature.properties.width,
          height: feature.properties.height,
          filename: feature.properties.filename
        };
        console.log("ImageBoundary trouvé:", feature.properties);
      }
      
      // Si c'est un mur
      else if (feature.properties.class_name === "wall") {
        if (feature.geometry.type === "Polygon") {
          const polygonCoords = feature.geometry.coordinates[0];
          
          // Si c'est un mur rectangulaire fin (comme dans votre exemple), 
          // on peut ne créer qu'un seul segment central au lieu de 4 segments
          if (polygonCoords.length === 5) { // Polygone fermé (5 points où le premier et le dernier sont identiques)
            const minX = Math.min(...polygonCoords.map(p => p[0]));
            const maxX = Math.max(...polygonCoords.map(p => p[0]));
            const minY = Math.min(...polygonCoords.map(p => p[1]));
            const maxY = Math.max(...polygonCoords.map(p => p[1]));
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Si c'est un mur fin (une dimension beaucoup plus grande que l'autre)
            if (width / height > 5 || height / width > 5) {
              // Mur horizontal ou vertical
              const isVertical = height > width;
              
              const wall = {
                id: `wall-${feature.properties.confidence || Date.now()}`,
                start: isVertical 
                  ? { x: (minX + maxX) / 2, y: minY } 
                  : { x: minX, y: (minY + maxY) / 2 },
                end: isVertical 
                  ? { x: (minX + maxX) / 2, y: maxY } 
                  : { x: maxX, y: (minY + maxY) / 2 },
                width: isVertical ? width : height, // L'épaisseur du mur
                properties: { ...feature.properties }
              };
              newWalls.push(wall);
              return; // Sortir de cette itération pour éviter de traiter ce polygone comme segments multiples
            }
          }
          
          // Sinon, traiter normalement comme segments multiples
          for (let i = 0; i < polygonCoords.length - 1; i++) {
            const wall = {
              id: `wall-${feature.properties.confidence || Date.now()}-${i}`,
              start: { x: polygonCoords[i][0], y: polygonCoords[i][1] },
              end: { x: polygonCoords[i+1][0], y: polygonCoords[i+1][1] },
              width: 1,
              properties: { ...feature.properties }
            };
            newWalls.push(wall);
          }
        }
      }
      
      // Si c'est une porte
      else if (feature.properties.class_name === "door") {
        if (feature.geometry.type === "Polygon") {
          // Utiliser les propriétés x1, y1, x2, y2 directement
          const centerX = (feature.properties.x1 + feature.properties.x2) / 2;
          const centerY = (feature.properties.y1 + feature.properties.y2) / 2;
          const width = Math.abs(feature.properties.x2 - feature.properties.x1);
          const height = Math.abs(feature.properties.y2 - feature.properties.y1);
          
          // Déterminer si la porte est horizontale ou verticale
          const isHorizontal = width > height;
          
          const door = {
            id: `door-${feature.properties.confidence || Date.now()}`,
            position: { x: centerX, y: centerY },
            width: width,
            height: height,
            rotation: isHorizontal ? 0 : 90, // 0 pour horizontale, 90 pour verticale
            properties: { ...feature.properties }
          };
          newDoors.push(door);
        }
      }
      
      // Si c'est une fenêtre
      else if (feature.properties.class_name === "window") {
        if (feature.geometry.type === "Polygon") {
          // Utiliser les propriétés x1, y1, x2, y2 directement
          const centerX = (feature.properties.x1 + feature.properties.x2) / 2;
          const centerY = (feature.properties.y1 + feature.properties.y2) / 2;
          const width = Math.abs(feature.properties.x2 - feature.properties.x1);
          const height = Math.abs(feature.properties.y2 - feature.properties.y1);
          
          // Déterminer si la fenêtre est horizontale ou verticale
          const isHorizontal = width > height;
          
          const window = {
            id: `window-${feature.properties.confidence || Date.now()}`,
            position: { x: centerX, y: centerY },
            width: width,
            height: height,
            rotation: isHorizontal ? 0 : 90, // 0 pour horizontale, 90 pour verticale
            properties: { ...feature.properties }
          };
          newWindows.push(window);
        }
      }
      
      // Si c'est une pièce
      else if (feature.properties.class_name === "room") {
        // Extraire les coordonnées du polygone
        const polygonCoords = feature.geometry.coordinates[0];
        
        // Transformer les coordonnées pour votre format de room
        const roomPoints = polygonCoords.map(point => ({ x: point[0], y: point[1] }));
        
        const room = {
          id: `room-${feature.properties.confidence || Date.now()}`,
          points: roomPoints,
          properties: { ...feature.properties }
        };
        
        newRooms.push(room);
        
        // Générer des murs à partir des arêtes du polygone
        for (let i = 0; i < polygonCoords.length - 1; i++) {
          const wall = {
            id: `wall-room-${feature.properties.confidence || Date.now()}-${i}`,
            start: { x: polygonCoords[i][0], y: polygonCoords[i][1] },
            end: { x: polygonCoords[i+1][0], y: polygonCoords[i+1][1] },
            width: 1,
            roomId: feature.properties.confidence
          };
          newWalls.push(wall);
        }
      }
    });
    
    // Filtrer les murs pour éliminer les doublons
    const uniqueWalls = [];
    const tolerance = 1; // Tolérance en pixels pour considérer des points comme identiques
  
    // Fonction pour vérifier si deux points sont presque identiques
    const pointsAreClose = (p1, p2) => {
      return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
    };
  
    // Fonction pour vérifier si deux segments sont presque identiques (même si inversés)
    const segmentsAreAlmostSame = (seg1, seg2) => {
      return (
        (pointsAreClose(seg1.start, seg2.start) && pointsAreClose(seg1.end, seg2.end)) ||
        (pointsAreClose(seg1.start, seg2.end) && pointsAreClose(seg1.end, seg2.start))
      );
    };
  
    // Filtrer les murs pour éliminer les doublons
    newWalls.forEach(wall => {
      if (!uniqueWalls.some(existingWall => segmentsAreAlmostSame(wall, existingWall))) {
        uniqueWalls.push(wall);
      }
    });
  
    return { walls: uniqueWalls, rooms: newRooms, doors: newDoors, windows: newWindows, imageInfo };
  };







// Fonction pour charger le GeoJSON à partir d'un fichier
  const loadFloorPlanFromFile = async (file) => {
    try {
      const jsonText = await file.text();
      const geoJSONData = JSON.parse(jsonText);
      const { walls, rooms, doors, imageInfo } = initializeFloorPlanFromGeoJSON(geoJSONData);
      
      // Mettre à jour l'état de votre application avec le plan d'étage
      setWalls(walls);
       setRooms(rooms);
      setDoors([]);
      console.log("Murs importés:", walls);
console.log("Portes importées:", doors);
console.log("Points du chemin:", pathPoints);
      
      // Optionnel: Mettre à jour la taille du canvas si nécessaire
      if (imageInfo) {
        // Vous pouvez décider comment vous souhaitez gérer la taille de l'image
        // Par exemple, vous pourriez vouloir adapter l'échelle
        const ratio = Math.min(
          canvasSize.width / imageInfo.width,
          canvasSize.height / imageInfo.height
        );
        setScale(ratio);
        
        // Centrer l'image
        setOffset({
          x: (canvasSize.width - imageInfo.width * ratio) / 2,
          y: (canvasSize.height - imageInfo.height * ratio) / 2
        });
      }
      
      // Mettre à jour le JSON affiché si vous le souhaitez
      setJsonData(jsonText);
      
      return true;
    } catch (error) {
      console.error("Erreur lors du chargement du fichier GeoJSON:", error);
      return false;
    }
  };
  
  // Dans votre composant React
  const handleGeoJSONUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const success = await loadFloorPlanFromFile(file);
      if (success) {
        console.log("Plan d'étage chargé avec succès");
        // Réinitialiser le chemin actuel et les points de navigation
        setPathPoints({ start: null, end: null });
        setCurrentPath([]);
        setSelectedItem(null);
      } else {
        console.error("Échec du chargement du plan d'étage");
      }
    }
  };






  const displayMeasurements = (ctx, startPoint, endPoint) => {
    // Calcul de la distance réelle en mètres (supposons que 1 unité = 1 cm)
    const pixelDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const SCALE_FACTOR = 0.02; // Exemple : 1 pixel = 1 cm = 0.01 m
    
    // Conversion en mètres (ajustez le facteur selon votre échelle)
    const meterDistance = (pixelDistance *SCALE_FACTOR).toFixed(2);
    
    // Position pour l'affichage (milieu du mur)
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;
    
    // Affichage de la mesure
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = `${meterDistance} m`;
    ctx.strokeText(text, midX, midY - 10);
    ctx.fillText(text, midX, midY - 10);
    ctx.restore();
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
                setWindows([]);
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
            onClick={exportToGeoJSON}
          >
            Exporter
          </button>
          <input
            type="file"
            id="fileInput"
            accept=".geojson"
            className="hidden"
            onChange={handleGeoJSONUpload}
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
                className={`w-full px-3 py-2 rounded ${tool === 'window' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setTool('window')}
                >
                Fenêtre
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

export default FloorPlanV4;
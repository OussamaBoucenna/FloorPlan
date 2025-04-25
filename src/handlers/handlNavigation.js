
import { createGrid} from '../Utils';

const findPath = (startX, startY, endX, endY, grid, cellSize) => {
    console.log("Calcul du chemin de (x,y)={", startX,",",startY, "} à (x,y)= {", endX,",",endY, "}");
    
    const startCol = Math.floor(startX / cellSize);
    const startRow = Math.floor(startY / cellSize);
    const endCol = Math.floor(endX / cellSize);
    const endRow = Math.floor(endY / cellSize);

    if (startRow < 0 || startCol < 0 || startRow >= grid.length || startCol >= grid[0].length ||
        endRow < 0 || endCol < 0 || endRow >= grid.length || endCol >= grid[0].length ||
        !grid[startRow][startCol].walkable || !grid[endRow][endCol].walkable) {
        console.warn("Points de départ ou d'arrivée dans une zone non traversable");
        return [];
    }

    const openSet = [{ row: startRow, col: startCol, f: 0, g: 0, h: 0 }];
    const closedSet = [];
    const cameFrom = {};

    while (openSet.length > 0) {
        let currentIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openSet[currentIndex];

        if (current.row === endRow && current.col === endCol) {
            const path = [];
            let curr = current;

            while (cameFrom[`${curr.row},${curr.col}`]) {
                path.push({
                    x: curr.col * cellSize + cellSize / 2,
                    y: curr.row * cellSize + cellSize / 2
                });
                curr = cameFrom[`${curr.row},${curr.col}`];
            }

            path.push({
                x: startCol * cellSize + cellSize / 2,
                y: startRow * cellSize + cellSize / 2
            });

            return path.reverse();
        }

        openSet.splice(currentIndex, 1);
        closedSet.push(current);

        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
        ];

        for (const dir of directions) {
            const neighborRow = current.row + dir.row;
            const neighborCol = current.col + dir.col;
            const key = `${neighborRow},${neighborCol}`;

            if (neighborRow < 0 || neighborCol < 0 || neighborRow >= grid.length || neighborCol >= grid[0].length ||
                !grid[neighborRow][neighborCol].walkable || closedSet.some(n => n.row === neighborRow && n.col === neighborCol)) {
                continue;
            }

            const gScore = current.g + 1;
            const openNeighbor = openSet.find(n => n.row === neighborRow && n.col === neighborCol);

            if (!openNeighbor || gScore < openNeighbor.g) {
                const h = Math.abs(neighborRow - endRow) + Math.abs(neighborCol - endCol);
                const f = gScore + h;

                if (!openNeighbor) {
                    openSet.push({ row: neighborRow, col: neighborCol, f, g: gScore, h });
                } else {
                    openNeighbor.f = f;
                    openNeighbor.g = gScore;
                    openNeighbor.h = h;
                }

                cameFrom[key] = current;
            }
        }
    }

    return [];
};

const calculatePath = (start, end, setCurrentPath, walls, doors) => {
    if (!start || !end) {
        console.warn("Les points de départ ou d'arrivée sont invalides :", start, end);
        return;
    }

    // Définir la taille des cellules de la grille (à ajuster selon vos besoins)
    const cellSize = 10; // Par exemple, 10 pixels par cellule
    
    // Récupérer les dimensions de votre espace
    const width = 2000; // À remplacer par la largeur de votre plan
    const height = 2000; // À remplacer par la hauteur de votre plan
    
    // Créer la grille
    const grid = createGrid(width, height, cellSize, walls, doors);
    console.log("Grid created with dimensions:", grid.length, "rows ×", grid[0].length, "columns");
    
    // Trouver le chemin entre les points de départ et d'arrivée
    const path = findPath(start.x, start.y, end.x, end.y, grid, cellSize);
    console.log("Path found:", path);
    
    if (path && path.length > 0) {
        setCurrentPath(path);
    } else {
        console.warn("Aucun chemin trouvé entre les points :", start, end);
        setCurrentPath([]);
    }
};

export const handlePath = (mousePos, pathPoints, setPathPoints, setCurrentPath, walls, doors) => {
    if (!pathPoints.start) {
        setPathPoints({ start: mousePos, end: null });
    } else if (!pathPoints.end) {
        setPathPoints(prev => {
            const newPathPoints = { ...prev, end: mousePos };
            calculatePath(newPathPoints.start, newPathPoints.end, setCurrentPath, walls, doors);
            return newPathPoints;
        });
    } else {
        setPathPoints({ start: mousePos, end: null });
        setCurrentPath([]);
    }
};

export const drawPath = (ctx, pathPoints, currentPath) => {
    if (pathPoints.start) {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(pathPoints.start.x, pathPoints.start.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (pathPoints.end) {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(pathPoints.end.x, pathPoints.end.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (currentPath.length > 1) {
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  };
  

export { findPath };


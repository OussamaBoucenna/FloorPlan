import { nearWallNode } from "./walls";

// utils.js - Helper functions and math utilities
export const utils = {
    // Angle in degrees between two points
    angleDeg: function(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    },
    
    // Create vector between two points
    vectorXY: function(start, end) {
      return {
        x: end.x - start.x,
        y: end.y - start.y
      };
    },
    
    // Determines which side of a line a point is on
    vectorDeter: function(v1, v2) {
      return v1.x * v2.y - v1.y * v2.x;
    },
    
    // Calculate midpoint between two points
    middle: function(x1, y1, x2, y2) {
      return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2
      };
    },
    
    // Check if value is between two numbers
    btwn: function(value, start, end, tolerance = 0.1) {
      const min = Math.min(start, end) - tolerance;
      const max = Math.max(start, end) + tolerance;
      return value >= min && value <= max;
    },
    
    // Create line equation from two points
    createEquation: function(x1, y1, x2, y2) {
      const A = y2 - y1;
      const B = x1 - x2;
      const C = A * x1 + B * y1;
      return { A, B, C };
    },
    
    // Calculate distance between point and line
    pointLineDistance: function(equation, point) {
      const numerator = Math.abs(equation.A * point.x + equation.B * point.y - equation.C);
      const denominator = Math.sqrt(equation.A * equation.A + equation.B * equation.B);
      return numerator / denominator;
    },
    
    // Calculate ray casting for hit testing
    rayCasting: function(point, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      return inside;
    },
    
    // Measure distance between two points
    measure: function(point1, point2) {
      return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + 
        Math.pow(point2.y - point1.y, 2)
      );
    }
  };

    export const calculateSnapPoint = (walls,point, gridSnap = true, gridSize = 20) => {
      // First check if near a wall node for connection/extension
      const nearNode = nearWallNode(walls,point);
      if (nearNode) {
        return nearNode;
      }
      
      // Otherwise snap to grid if enabled
      if (gridSnap) {
        return {
          x: Math.round(point.x / gridSize) * gridSize,
          y: Math.round(point.y / gridSize) * gridSize
        };
      }
      
      return point;
    };

    export const findRoomAtPoint = (rooms,point) => {
      const sortedRooms = [...rooms.polygons]
        .map((room, index) => ({ ...room, id: index }))
        .sort((a, b) => a.area - b.area);
      
      for (const room of sortedRooms) {
        if (isPointInPolygon(point, room.coords)) {
          return room.id;
        }
      }
      
      return null;
    };

    export const isPointInPolygon = (point, polygon) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // get Room Center 
    export const getRoomCenter = (rooms,roomId) => {
        const room = rooms.polygons[roomId];
        if (!room || !room.coords || room.coords.length === 0) {
          return { x: 0, y: 0 };
        }
        
        // Calculate average of all coordinates
        const center = room.coords.reduce(
          (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
          { x: 0, y: 0 }
        );
        return {
          x: center.x / room.coords.length,
          y: center.y / room.coords.length
        };
      };

      export const isPointsEqual = (p1, p2, tolerance = 1) => {
        return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
      };

      export const almostEqual = (a, b, tolerance = 0.5) => {
        return Math.abs(a - b) < tolerance;
      };
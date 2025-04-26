
import { carpentryCalc } from './helper';
import { meter, factor, originX_viewbox, originY_viewbox } from './constants';
import { utils } from "./utils"
export default class Obj2D {
  constructor(family, classe, type,wallId, pos, angle, angleSign, size, hinge = 'normal', thick, value = 0, meter = 60) {
    this.family = family;   // inWall, stick, collision, free
    this.class = classe;    // door, window, energy, stair, measure, text
    this.type = type;       // simple, double, simpleSlide, aperture, etc.
    this.x = pos.x;
    this.y = pos.y;
    this.angle = angle;
    this.angleSign = angleSign;
    this.limit = [];
    this.hinge = hinge;     // normal, reverse
    this.size = size;
    this.thick = thick;
    this.value = value;
    this.width = (this.size / meter).toFixed(2);
    this.height = (this.thick / meter).toFixed(2);
    this.meter = meter;
    this.wallId = wallId
    /*const cc = carpentryCalcDoorWindow(type, size, thick);
    for (let tt = 0; tt < cc.length; tt++) {
      let elem;
      if (cc[tt].path) {
        elem = createSVGElement(null, 'path', {
          d: cc[tt].path,
          'stroke-width': 1,
          fill: cc[tt].fill,
          stroke: cc[tt].stroke,
          'stroke-dasharray': cc[tt].strokeDashArray || '',
          opacity: cc[tt].opacity ?? 1,
        });
      } else if (cc[tt].text) {
        elem = createSVGElement(null, 'text', {
          x: cc[tt].x,
          y: cc[tt].y,
          'font-size': cc[tt].fontSize,
          stroke: cc[tt].stroke,
          'stroke-width': cc[tt].strokeWidth,
          'font-family': 'roboto',
          'text-anchor': 'middle',
          fill: cc[tt].fill,
        });
        elem.textContent = cc[tt].text;
      }
  
      if (elem) this.graph.appendChild(elem);
    }
    // Now calculate the bounding box inside SVG space
    const bbox = this.graph.getBBox();
  
    this.bbox = {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      origin: { x: this.x, y: this.y },
    };
  
    this.realBbox = [
      { x: -this.size / 2, y: -this.thick / 2 },
      { x: this.size / 2, y: -this.thick / 2 },
      { x: this.size / 2, y: this.thick / 2 },
      { x: -this.size / 2, y: this.thick / 2 },
    ];
  
    if (family === "byObject") this.family = cc.family;
    this.params = cc.params;
    this.size = cc.params.width ?? size;
    this.thick = cc.params.height ?? thick;
  
    // Finally, apply SVG transform to center at (this.x, this.y)
    const translateStr = `translate(${this.x}, ${this.y}) rotate(${this.angle})`;
    this.graph.setAttribute("transform", translateStr);
  
    return this.graph;*/
    // Calculate visual appearance
    this.paths = carpentryCalc(classe, type, size, thick, value);
    this.params = this.paths.params;
    
    // Calculate bounding box
    this.calculateBoundingBox();
  }

  clone(){
    return new Obj2D(this.family, this.class, this.type,this.wallId, {x: this.x, y: this.y}, this.angle, this.angleSign, this.size, this.hinge, this.thick, this.value, this.meter,this.height,this.width,this.update.bind(this),this.calculateBoundingBox.bind(this),this.draw.bind(this),this.containsPoint.bind(this),this.drawArc.bind(this),this._getOffset.bind(this),this.drawSpecializedElement.bind(this),this.drawDoubleDoor.bind(this),this.drawSingleDoor.bind(this),this.drawSingleWindow.bind(this),this.drawDoubleDoor.bind(this),this.drawFromPaths.bind(this), this._updateBBox.bind(this));
  }


  calculateBoundingBox() {
    // Initial bounding box (rectangle centered at origin)
    this.realBbox = [
      { x: -this.size / 2, y: -this.thick / 2 }, 
      { x: this.size / 2, y: -this.thick / 2 }, 
      { x: this.size / 2, y: this.thick / 2 }, 
      { x: -this.size / 2, y: this.thick / 2 }
    ];
    
    // Apply rotation and translation to bounding box
    const angleRadian = -(this.angle) * (Math.PI / 180);
    const newRealBbox = [
      { x: 0, y: 0 }, 
      { x: 0, y: 0 }, 
      { x: 0, y: 0 }, 
      { x: 0, y: 0 }
    ];
    for (let i = 0; i < 4; i++) {
      newRealBbox[i].x = (this.realBbox[i].y * Math.sin(angleRadian) + 
                         this.realBbox[i].x * Math.cos(angleRadian)) + this.x;
                         
      newRealBbox[i].y = (this.realBbox[i].y * Math.cos(angleRadian) - 
                         this.realBbox[i].x * Math.sin(angleRadian)) + this.y;
    }
    
    this.realBbox = newRealBbox;
    
    // Update control points if they exist
    if (this.controlPoints) {
      for (let i = 0; i < this.controlPoints.length; i++) {
        this.controlPoints[i].x = this.x + this.controlPoints[i].relX;
        this.controlPoints[i].y = this.y + this.controlPoints[i].relY;
      }
    }
  }

  // Check if a point is inside this object
  containsPoint(point) {
    return utils.rayCasting(point, this.realBbox);
  }

  draw(ctx, isPreview = false) {
    if (!ctx) return;
    
    ctx.save();
    
    // Apply transformations
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle * Math.PI / 180);
    
    // Apply hinge direction
    const hingeScale = this.hinge === 'normal' ? 1 : -1;
    ctx.scale(hingeScale, 1);
    
    // Set transparency for preview
    if (isPreview) {
      ctx.globalAlpha = 0.7;
    }
    
    // Draw based on type instead of using generic path rendering
    this.drawSpecializedElement(ctx, isPreview);
    
    // Draw bounding box for debugging/preview
    if (isPreview) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-this.size/2, -this.thick/2, this.size, this.thick);
    }
    
    ctx.restore();
  }
  
  drawSpecializedElement(ctx, isPreview) {
    const halfSize = this.size / 2;
    const halfThick = this.thick / 2;
    
    // Use specialized drawing based on type
    switch(this.type) {
      case 'doorSingle':
       // console.log("called here ....",this.type)
        this.drawSingleDoor(ctx, halfSize, halfThick, isPreview,"#7EBDC2","#7EBDC2");
        break;
      case 'doorDouble':
        this.drawDoubleDoor(ctx, halfSize, halfThick,isPreview, '#7EBDC2', '#9CCFD9');
        break;
      case 'windowSingle':
        this.drawSingleWindow(ctx, halfSize, halfThick, isPreview);
        break;
      case 'windowDouble':
        this.drawDoubleWindow(ctx, halfSize, halfThick, isPreview);
        break;
      case 'doorSlide':
        this.drawSlidingDoor(ctx, halfSize, halfThick, isPreview);
        break;
      default:
        // Fallback to generic path rendering
        this.drawFromPaths(ctx);
        break;
    }
  }
  
  drawSingleDoor(ctx, halfSize, halfThick, isPreview, arcBgColor = null, arcStrokeColor = null) {
    const doorWidth = this.size;
    const doorHeight = this.thick;
    const pivotX = -halfSize;
    const arcRadius = doorWidth * 0.92;

    // --- Swing Arc Background ---
    ctx.beginPath();
    ctx.moveTo(pivotX, 0);
    ctx.arc(pivotX, 0, arcRadius, -Math.PI/2, 0, false);
    ctx.closePath();

    if (arcBgColor) {
        // Use provided solid background color
        ctx.fillStyle = arcBgColor;
    } else {
        // Default subtle gradient
        const gradient = ctx.createRadialGradient(
            pivotX, 0, arcRadius * 0.2,
            pivotX, 0, arcRadius * 1.1
        );
        gradient.addColorStop(0, 'rgba(210, 220, 235, 0.1)');
        gradient.addColorStop(1, 'rgba(200, 210, 225, 0.03)');
        ctx.fillStyle = gradient;
    }
    ctx.fill();

    // --- Door Frame ---
    ctx.fillStyle = isPreview ? 'rgba(159, 178, 226, 0.6)' : '#e0e8f5';
    ctx.fillRect(pivotX, -halfThick, doorWidth, doorHeight);

    // --- Door Panel ---
    ctx.fillStyle = isPreview ? 'rgba(200, 210, 230, 0.6)' : '#f0f4fb';
    ctx.fillRect(pivotX + 1.5, -halfThick + 1.5, doorWidth - 3, doorHeight - 3);

    // --- Panel Details ---
    if (doorWidth > 30) {
        ctx.strokeStyle = '#d0d8e5';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(pivotX + 4, -halfThick + 4, doorWidth - 8, doorHeight - 8);

        const handlePos = this.angleSign === 1 ? pivotX + 12 : pivotX + doorWidth - 12;
        ctx.beginPath();
        ctx.fillStyle = '#a0a8b5';
        ctx.arc(handlePos, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- Swing Arc Line ---
    ctx.beginPath();
    ctx.arc(pivotX, 0, arcRadius, -Math.PI/2, 0, false);
    ctx.strokeStyle = arcStrokeColor 
        ? arcStrokeColor 
        : (isPreview ? 'rgba(160, 170, 180, 0.4)' : '#d0d8e0');
    ctx.lineWidth = 0.8;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Door Outline ---
    ctx.strokeStyle = '#c0c8d0';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(pivotX, -halfThick, doorWidth, doorHeight);

    // --- Panel Line ---
    ctx.beginPath();
    ctx.moveTo(pivotX, 0);
    ctx.lineTo(pivotX + arcRadius, 0);
    ctx.strokeStyle = '#a0a8b5';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
}

  
drawDoubleDoor(ctx, halfSize, halfThick, isPreview, arcBgColor = null, arcStrokeColor = null) {
  const doorWidth = this.size;
  const doorHeight = this.thick;
  const arcRadius = doorWidth * 0.45;
  const pivotLeft = -halfSize;
  const pivotRight = halfSize;

  // --- Left Swing Arc Background ---
  ctx.beginPath();
  ctx.moveTo(pivotLeft, 0);
  ctx.arc(pivotLeft, 0, arcRadius, -Math.PI / 2, 0, false);
  ctx.closePath();

  ctx.fillStyle = arcBgColor
    ? arcBgColor
    : (() => {
        const grad = ctx.createRadialGradient(
          pivotLeft, 0, arcRadius * 0.2,
          pivotLeft, 0, arcRadius * 1.1
        );
        grad.addColorStop(0, 'rgba(210, 220, 235, 0.1)');
        grad.addColorStop(1, 'rgba(200, 210, 225, 0.03)');
        return grad;
      })();
  ctx.fill();

  // --- Right Swing Arc Background ---
  ctx.beginPath();
  ctx.moveTo(pivotRight, 0);
  ctx.arc(pivotRight, 0, arcRadius, -Math.PI, -Math.PI / 2, false);
  ctx.closePath();

  ctx.fillStyle = arcBgColor
    ? arcBgColor
    : (() => {
        const grad = ctx.createRadialGradient(
          pivotRight, 0, arcRadius * 0.2,
          pivotRight, 0, arcRadius * 1.1
        );
        grad.addColorStop(0, 'rgba(210, 220, 235, 0.1)');
        grad.addColorStop(1, 'rgba(200, 210, 225, 0.03)');
        return grad;
      })();
  ctx.fill();

  // --- Door Frame ---
  ctx.fillStyle = isPreview ? 'rgba(159, 178, 226, 0.6)' : '#e0e8f5';
  ctx.fillRect(-halfSize, -halfThick, doorWidth, doorHeight);

  // --- Door Panels ---
  ctx.fillStyle = isPreview ? 'rgba(200, 210, 230, 0.6)' : '#f0f4fb';
  const inset = 1.5;
  ctx.fillRect(-halfSize + inset, -halfThick + inset, halfSize - 2, doorHeight - 2 * inset);
  ctx.fillRect(inset / 2, -halfThick + inset, halfSize - 2, doorHeight - 2 * inset);

  // --- Panel Details ---
  if (doorWidth > 30) {
    ctx.strokeStyle = '#d0d8e5';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-halfSize + 4, -halfThick + 4, halfSize - 8, doorHeight - 8);
    ctx.strokeRect(4, -halfThick + 4, halfSize - 8, doorHeight - 8);

    // Handles
    ctx.fillStyle = '#a0a8b5';
    ctx.beginPath();
    ctx.arc(-halfSize + 12, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(halfSize - 12, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Swing Arc Lines ---
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = arcStrokeColor
    ? arcStrokeColor
    : (isPreview ? 'rgba(160, 170, 180, 0.4)' : '#d0d8e0');
  ctx.lineWidth = 0.8;

  // Left arc line
  ctx.beginPath();
  ctx.arc(pivotLeft, 0, arcRadius, -Math.PI / 2, 0, false);
  ctx.stroke();

  // Right arc line
  ctx.beginPath();
  ctx.arc(pivotRight, 0, arcRadius, -Math.PI, -Math.PI / 2, false);
  ctx.stroke();

  ctx.setLineDash([]);

  // --- Center Divider Line ---
  ctx.beginPath();
  ctx.moveTo(0, -halfThick);
  ctx.lineTo(0, halfThick);
  ctx.strokeStyle = '#a0a8b5';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // --- Door Outline ---
  ctx.strokeStyle = '#c0c8d0';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-halfSize, -halfThick, doorWidth, doorHeight);

  // --- Panel Edge Lines ---
  ctx.beginPath();
  ctx.moveTo(pivotLeft, 0);
  ctx.lineTo(pivotLeft + arcRadius, 0);
  ctx.moveTo(pivotRight, 0);
  ctx.lineTo(pivotRight - arcRadius, 0);
  ctx.strokeStyle = '#a0a8b5';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.stroke();
}




  
  drawSingleWindow(ctx, halfSize, halfThick, isPreview, frameColor = '#ceecf0', outlineColor = '#333') {
    // --- Frame background ---
    ctx.fillStyle = isPreview ? 'rgba(206, 236, 240, 0.8)' : frameColor;
    ctx.fillRect(-halfSize, -halfThick, this.size, this.thick);
  
    // --- Glass effect with subtle gradient ---
    const glassInset = 2;
    const gradient = ctx.createLinearGradient(-halfSize, -halfThick, halfSize, halfThick);
    gradient.addColorStop(0, isPreview ? 'rgba(240, 255, 255, 0.4)' : 'rgba(230, 250, 255, 0.6)');
    gradient.addColorStop(1, isPreview ? 'rgba(210, 240, 250, 0.3)' : 'rgba(220, 245, 255, 0.4)');
  
    ctx.fillStyle = gradient;
    ctx.fillRect(
      -halfSize + glassInset,
      -halfThick + glassInset,
      this.size - 2 * glassInset,
      this.thick - 2 * glassInset
    );
  
    // --- Horizontal divider ---
    ctx.beginPath();
    ctx.moveTo(-halfSize + 3, 0);
    ctx.lineTo(halfSize - 3, 0);
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  
    // --- Outer window border ---
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfSize, -halfThick, this.size, this.thick);
  
    // --- Subtle 3D shading (light and shadow) ---
    // Light top and left
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-halfSize, -halfThick);
    ctx.lineTo(halfSize, -halfThick);
    ctx.moveTo(-halfSize, -halfThick);
    ctx.lineTo(-halfSize, halfThick);
    ctx.stroke();
  
    // Shadow bottom and right
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.beginPath();
    ctx.moveTo(halfSize, -halfThick);
    ctx.lineTo(halfSize, halfThick);
    ctx.moveTo(-halfSize, halfThick);
    ctx.lineTo(halfSize, halfThick);
    ctx.stroke();
  }
  
  
  drawDoubleWindow(ctx, halfSize, halfThick, isPreview) {
    // Frame
    ctx.fillStyle = isPreview ? 'rgba(206, 236, 240, 0.7)' : '#ceecf0';
    ctx.fillRect(-halfSize, -halfThick, this.size, this.thick);
  
    // Glass area
    const glassInset = 2.5;
    const glassX = -halfSize + glassInset;
    const glassY = -halfThick + glassInset;
    const glassW = this.size - glassInset * 2;
    const glassH = this.thick - glassInset * 2;
  
    ctx.fillStyle = isPreview ? 'rgba(230, 250, 255, 0.4)' : 'rgba(230, 250, 255, 0.6)';
    ctx.fillRect(glassX, glassY, glassW, glassH);
  
    // Gradient shine
    const gradient = ctx.createLinearGradient(glassX, glassY, glassX + glassW, glassY + glassH);
    gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(200,220,255,0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(glassX, glassY, glassW, glassH);
  
    // Divider lines (cross)
    ctx.beginPath();
    ctx.moveTo(-halfSize, 0);
    ctx.lineTo(halfSize, 0);
    ctx.moveTo(0, -halfThick);
    ctx.lineTo(0, halfThick);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.stroke();
  
    // Optional extra grid for large windows
    if (this.size > 40) {
      const third = this.size / 6;
      ctx.beginPath();
      ctx.moveTo(-halfSize + third, -halfThick);
      ctx.lineTo(-halfSize + third, halfThick);
      ctx.moveTo(halfSize - third, -halfThick);
      ctx.lineTo(halfSize - third, halfThick);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  
    // Frame outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfSize, -halfThick, this.size, this.thick);
  
    // 3D Highlight effect
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-halfSize, -halfThick);
    ctx.lineTo(-halfSize, halfThick);
    ctx.moveTo(-halfSize, -halfThick);
    ctx.lineTo(halfSize, -halfThick);
    ctx.stroke();
  }
  
  
  drawSlidingDoor(ctx, halfSize, halfThick, isPreview) {
    // Door frame
    ctx.fillStyle = isPreview ? 'rgba(159, 178, 226, 0.8)' : '#9fb2e2';
    ctx.fillRect(-halfSize, -halfThick, this.size, this.thick);
    // Track at top and bottom
    ctx.fillStyle = '#666';
    ctx.fillRect(-halfSize, -halfThick, this.size, 1);
    ctx.fillRect(-halfSize, halfThick - 1, this.size, 1);
    
    // Door panels
    const doorWidth = this.size * 0.4;
    const leftDoorX = -halfSize + this.size * 0.1;
    const rightDoorX = leftDoorX + doorWidth;
    
    // Left panel
    ctx.fillStyle = isPreview ? 'rgba(179, 198, 246, 0.8)' : '#b3c6f6';
    ctx.fillRect(leftDoorX, -halfThick + 2, doorWidth, this.thick - 4);
    
    // Right panel
    ctx.fillStyle = isPreview ? 'rgba(199, 218, 255, 0.8)' : '#c7daff';
    ctx.fillRect(rightDoorX, -halfThick + 2, doorWidth, this.thick - 4);
    
    // Panel borders
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftDoorX, -halfThick + 2, doorWidth, this.thick - 4);
    ctx.strokeRect(rightDoorX, -halfThick + 2, doorWidth, this.thick - 4);
    
    // Door handles
    ctx.fillStyle = '#333';
    ctx.fillRect(leftDoorX + doorWidth - 3, -2, 2, 4);
    ctx.fillRect(rightDoorX + 1, -2, 2, 4);
    
    // Arrow indicating sliding direction
    ctx.beginPath();
    ctx.moveTo(-halfSize + 5, 0);
    ctx.lineTo(-halfSize + this.size - 5, 0);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(halfSize - 10, -3);
    ctx.lineTo(halfSize - 5, 0);
    ctx.lineTo(halfSize - 10, 3);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.stroke();
    
    // Door frame
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfSize, -halfThick, this.size, this.thick);
  }
  
  // Original path-based drawing method as fallback
  drawFromPaths(ctx) {
    for (let i = 0; i < this.paths.length; i++) {
      const path = this.paths[i];
      
      ctx.beginPath();
      if (path.path) {
        const commands = this.parseSvgPath(path.path);
        for (const cmd of commands) {
          switch (cmd.type) {
            case 'M':
              ctx.moveTo(cmd.x, cmd.y);
              break;
            case 'L':
              ctx.lineTo(cmd.x, cmd.y);
              break;
            case 'A':
              this.drawArc(ctx, cmd.rx, cmd.ry, cmd.xAxisRotation, 
                          cmd.largeArcFlag, cmd.sweepFlag, cmd.x, cmd.y);
              break;
            case 'Z':
              ctx.closePath();
              break;
          }
        }
      }
      
      // Apply styles
      if (path.fill && path.fill !== 'none') {
        ctx.fillStyle = path.fill;
        ctx.fill();
      }
      
      if (path.stroke && path.stroke !== 'none') {
        ctx.strokeStyle = path.stroke;
        ctx.lineWidth = 1;
        
        if (path.strokeDashArray && path.strokeDashArray !== 'none') {
          const dashArray = path.strokeDashArray.split(',').map(Number);
          ctx.setLineDash(dashArray);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
      }
    }
  }
  
  // Improved arc drawing function
  drawArc(ctx, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
    // Get current point
    const currentX = ctx._currentPointX || 0;
    const currentY = ctx._currentPointY || 0;
    
    // This is a simplified elliptical arc implementation
    // For truly accurate SVG arc rendering, more complex code would be needed
    
    // Convert to center parameterization
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    xAxisRotation = xAxisRotation * Math.PI / 180;
    
    // Approximate with circular arc - for visual quality only
    const centerX = (currentX + x) / 2;
    const centerY = (currentY + y) / 2;
    
    // Calculate radius
    const radius = Math.sqrt(Math.pow(x - currentX, 2) + Math.pow(y - currentY, 2)) / 2;
    
    // Calculate start and end angles
    const startAngle = Math.atan2(currentY - centerY, currentX - centerX);
    const endAngle = Math.atan2(y - centerY, x - centerX);
    
    // Draw the arc
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, sweepFlag === 0);
    
    // Update current point for next command
    ctx._currentPointX = x;
    ctx._currentPointY = y;
  }

  // Update geometry and appearance
  update() {
    // Update dimensions
    this.width = (this.size / this.meter).toFixed(2);
    this.height = (this.thick / this.meter).toFixed(2);
    
    // Update visual paths
    this.paths = carpentryCalc(this.class, this.type, this.size, this.thick, this.value);
   // console.log("ici  ",this.x,this.y)
    // Calculate new bounding box
    this.calculateBoundingBox();
    return true;
  }
  _getOffset() {
    const svgElement = document.getElementById('wrapperSvg');
    if (!svgElement) {
      console.warn('wrapperSvg element not found');
      return { top: 0, left: 0 };
    }
  
    const rect = svgElement.getBoundingClientRect();
    return {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset
    };
  }
  _updateBBox() {
    const offset = this._getOffset();
  
    let bbox;
    try {
      bbox = this.graph.getBBox(); // SVG-space bounding box
    } catch (e) {
      console.warn("getBBox failed, falling back to getBoundingClientRect");
      bbox = this.graph.getBBox();
    }
  
    // Assuming factor and originX_viewbox are defined
    bbox.x = (bbox.x * factor) - (offset.left * factor) + originX_viewbox;
    bbox.y = (bbox.y * factor) - (offset.top  * factor) + originY_viewbox;
  
    bbox.origin = { x: this.x, y: this.y };
  
    this.bbox = bbox;
    console.log("Updated bbox:", bbox);
  }
}

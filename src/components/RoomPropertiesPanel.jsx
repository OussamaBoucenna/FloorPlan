const RoomPropertiesPanel = ({ 
  visible, 
  roomId, 
  roomProps, 
  onPropsChange, 
  onSave, 
  onCancel 
}) => {
  if (!visible) return null;
  
  return (
    <div className="room-properties-panel">
      <h3>Room Properties</h3>
      
      <div className="form-group">
        <label>Room Name:</label>
        <input 
          type="text" 
          value={roomProps.name} 
          onChange={(e) => onPropsChange({...roomProps, name: e.target.value})} 
          placeholder="Enter room name"
        />
      </div>
      
      <div className="form-group">
        <label>Room Color:</label>
        <input 
          type="color" 
          value={roomProps.color} 
          onChange={(e) => onPropsChange({...roomProps, color: e.target.value})} 
        />
      </div>
      
      <div className="form-group">
        <label>
          <input 
            type="checkbox" 
            checked={roomProps.showSurface} 
            onChange={(e) => onPropsChange({...roomProps, showSurface: e.target.checked})} 
          />
          Show Room Area
        </label>
      </div>
      
      <div className="button-container">
        <button onClick={() => onSave(roomId, roomProps)}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default RoomPropertiesPanel
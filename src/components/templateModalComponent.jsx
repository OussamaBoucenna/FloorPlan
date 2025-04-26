import React from 'react';
import { TemplateSelector } from './templateSelectionComponent';

export const TemplateModal = ({ isOpen, onClose, onTemplateSelect, onDimensionsConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Choose Floor Plan Template</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <TemplateSelector
          onTemplateSelect={onTemplateSelect}
          onDimensionsConfirm={(template, dimensions) => {
            onDimensionsConfirm(template, dimensions);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
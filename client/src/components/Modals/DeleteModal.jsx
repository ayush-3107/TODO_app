import { motion } from "framer-motion";
import { useEffect } from "react";

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName 
}) => {
  // Add keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    // Add event listener when modal is open
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener when modal closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-sm"
      >
        <h3 className="text-xl font-bold mb-4">
          Delete "{itemName}"?
        </h3>
        
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteModal;

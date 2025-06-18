import { motion } from "framer-motion";

const AddListModal = ({ 
  isOpen, 
  onClose, 
  newListName, 
  setNewListName, 
  onAdd 
}) => {
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
        <h3 className="text-xl font-bold mb-4">New List</h3>
        <form
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newListName.trim()) {
              e.preventDefault();
              onAdd();
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (newListName.trim()) {
              onAdd();
            }
          }}
        >
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Enter list name"
            className="w-full px-4 py-2 mb-4 rounded-md bg-[#334155] text-white outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newListName.trim()}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddListModal;

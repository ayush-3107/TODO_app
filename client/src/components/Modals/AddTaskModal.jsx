import { motion } from "framer-motion";
import { isValidYear } from "../../utils/dateUtils";

const AddTaskModal = ({ 
  isOpen, 
  onClose, 
  newSubtaskName, 
  setNewSubtaskName,
  newSubtaskDeadline,
  setNewSubtaskDeadline,
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
        className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
      >
        <h3 className="text-xl font-bold mb-4">Add Task</h3>
        
        <form
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newSubtaskName.trim()) {
              e.preventDefault();
              onAdd();
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (newSubtaskName.trim()) {
              onAdd();
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Task Name</label>
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="Enter task name"
                className="w-full px-4 py-2 rounded-md bg-[#334155] text-white outline-none"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Deadline (Optional)</label>
              <input
                type="date"
                value={newSubtaskDeadline}
                onChange={(e) => {
                  setNewSubtaskDeadline(e.target.value);
                }}
                onBlur={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate && !isValidYear(selectedDate)) {
                    setNewSubtaskDeadline("");
                  }
                }}
                min="1000-01-01"
                max="9999-12-31"
                className={`w-full px-4 py-2 rounded-md bg-[#334155] text-white outline-none ${
                  newSubtaskDeadline && !isValidYear(newSubtaskDeadline) ? 'border border-red-500' : ''
                }`}
              />
              {newSubtaskDeadline && !isValidYear(newSubtaskDeadline) && (
                <p className="text-xs text-red-400 mt-1">Please enter a valid 4-digit year</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Please enter a year up to 9999.</p>
            </div>
          </div>


          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newSubtaskName.trim()}
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

export default AddTaskModal;

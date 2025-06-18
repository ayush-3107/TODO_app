import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const dummyLists = [
  "Study for exams",
  "Grocery shopping",
  "Workout routine",
  "Read a book",
  "Plan vacation",
  "Clean the house",
  "Prepare presentation",
  "Organize files",
  "List 2",
  "List 3",
  "List 4",
  "List 5",
  "List 6",
  "List 7",
  "List 8",
];

export default function TodoListsPage() {
  const [lists, setLists] = useState(dummyLists);
  const [subtasks, setSubtasks] = useState({}); // Store subtasks for each list
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [direction, setDirection] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  
  // Subtask modal states
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [currentListIndex, setCurrentListIndex] = useState(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskDeadline, setNewSubtaskDeadline] = useState("");
  
  const undoTimeoutRef = useRef(null);

  const listsPerPage = 5;
  const totalPages = Math.ceil(lists.length / listsPerPage);
  const startIndex = currentPage * listsPerPage;
  const visibleLists = lists.slice(startIndex, startIndex + listsPerPage);

  const addList = () => {
    if (newListName.trim()) {
      setLists((prev) => [...prev, newListName.trim()]);
      setNewListName("");
      setShowAddModal(false);
    }
  };

  const addSubtask = () => {
    if (newSubtaskName.trim() && currentListIndex !== null) {
      const newSubtask = {
        id: Date.now(),
        name: newSubtaskName.trim(),
        deadline: newSubtaskDeadline || null,
        completed: false,
        createdAt: new Date().toISOString()
      };

      setSubtasks(prev => ({
        ...prev,
        [currentListIndex]: [...(prev[currentListIndex] || []), newSubtask]
      }));

      setNewSubtaskName("");
      setNewSubtaskDeadline("");
      setShowSubtaskModal(false);
      setCurrentListIndex(null);
    }
  };

  const toggleSubtaskComplete = (listIndex, subtaskId) => {
    setSubtasks(prev => ({
      ...prev,
      [listIndex]: prev[listIndex]?.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      ) || []
    }));
  };

  const deleteSubtask = (listIndex, subtaskId) => {
    setSubtasks(prev => ({
      ...prev,
      [listIndex]: prev[listIndex]?.filter(subtask => subtask.id !== subtaskId) || []
    }));
  };

  const changePage = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setDirection(newPage > currentPage ? 1 : -1);
      setCurrentPage(newPage);
    }
  };

  const containerVariants = {
    enter: (dir) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -1000 : 1000, opacity: 0 }),
  };

  const cardVariants = {
    initial: { opacity: 1, x: 0 },
    exit: {
      opacity: 0,
      x: -100,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  const handleDelete = () => {
    const { index, name } = listToDelete;
    const newList = [...lists];
    newList.splice(index, 1);
    setLists(newList);
    
    // Also remove subtasks for this list
    setSubtasks(prev => {
      const newSubtasks = { ...prev };
      delete newSubtasks[index];
      return newSubtasks;
    });
    
    setShowDeleteModal(false);

    setLastDeleted({ name, index });
    clearTimeout(undoTimeoutRef.current);

    undoTimeoutRef.current = setTimeout(() => {
      setLastDeleted(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (lastDeleted) {
      const newList = [...lists];
      newList.splice(lastDeleted.index, 0, lastDeleted.name);
      setLists(newList);
      setLastDeleted(null);
      clearTimeout(undoTimeoutRef.current);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <h2 className="text-2xl font-bold">Welcome, Username</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-300 text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-400"
        >
          + Add List
        </button>
      </div>

      {/* Animated List Container */}
      <div className="flex-1 px-8 flex items-center relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="grid grid-cols-5 gap-6 w-full"
          >
            {visibleLists.map((listName, index) => {
              const globalIndex = startIndex + index;
              const listSubtasks = subtasks[globalIndex] || [];
              const completedCount = listSubtasks.filter(task => task.completed).length;
              
              return (
                <AnimatePresence key={globalIndex}>
                  <motion.div
                    key={listName}
                    variants={cardVariants}
                    initial="initial"
                    animate="initial"
                    exit="exit"
                    layout
                    onClick={() => setSelectedIndex(globalIndex)}
                    className={`relative h-[80vh] cursor-pointer rounded-2xl transition-all duration-300 group
                      ${
                        globalIndex === selectedIndex
                          ? "border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-origin-border"
                          : "border border-transparent"
                      }
                      hover:border-[2px] hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-origin-border
                    `}
                  >
                    {/* Delete Icon (hover only) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDelete({
                          index: globalIndex,
                          name: listName,
                        });
                        setShowDeleteModal(true);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1 cursor-pointer z-10"
                      title="Delete list"
                    >
                      ✖
                    </div>

                    <div className="h-full w-full rounded-[1rem] bg-[#334155] p-4 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-white">
                          {listName}
                        </h3>
                        
                        {/* Progress indicator */}
                        {listSubtasks.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-300 mb-1">
                              {completedCount}/{listSubtasks.length} completed
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${listSubtasks.length > 0 ? (completedCount / listSubtasks.length) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Subtasks list */}
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                          {listSubtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className={`p-3 rounded-lg bg-[#475569] flex items-start justify-between group/subtask
                                ${subtask.completed ? 'opacity-60' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => toggleSubtaskComplete(globalIndex, subtask.id)}
                                  className="mt-1 accent-blue-500 w-4 h-4"
                                />
                                <div className="flex-1">
                                  <div className={`text-base font-medium ${subtask.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                                    {subtask.name}
                                  </div>
                                  {subtask.deadline && (
                                    <div className={`text-sm mt-1 ${
                                      isOverdue(subtask.deadline) && !subtask.completed
                                        ? 'text-red-400'
                                        : 'text-gray-400'
                                    }`}>
                                      Due: {formatDate(subtask.deadline)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteSubtask(globalIndex, subtask.id)}
                                className="opacity-0 group-hover/subtask:opacity-100 text-red-600 hover:text-red-500 text-sm ml-2 transition-colors duration-200"
                                title="Delete subtask"
                              >
                                ✖
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add Task Button - Only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentListIndex(globalIndex);
                          setShowSubtaskModal(true);
                        }}
                        className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                          rounded-lg text-sm font-medium transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        + Add Task
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-8 py-4">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 0}
          className={`px-6 py-3 text-xl rounded-full ${
            currentPage === 0
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          ◀
        </button>
        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className={`px-6 py-3 text-xl rounded-full ${
            currentPage >= totalPages - 1
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          ▶
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-sm"
          >
            <h3 className="text-xl font-bold mb-4">
              Delete "{listToDelete?.name}"?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-sm"
          >
            <h3 className="text-xl font-bold mb-4">New List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name"
              className="w-full px-4 py-2 mb-4 rounded-md bg-[#334155] text-white outline-none"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setNewListName("");
                  setShowAddModal(false);
                }}
                className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addList}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Task Modal */}
      {showSubtaskModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">Add Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Name</label>
                <input
                  type="text"
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  placeholder="Enter task name"
                  className="w-full px-4 py-2 rounded-md bg-[#334155] text-white outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Deadline (Optional)</label>
                <input
                  type="date"
                  value={newSubtaskDeadline}
                  onChange={(e) => setNewSubtaskDeadline(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-[#334155] text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setNewSubtaskName("");
                  setNewSubtaskDeadline("");
                  setShowSubtaskModal(false);
                  setCurrentListIndex(null);
                }}
                className="px-4 py-2 rounded-full bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addSubtask}
                disabled={!newSubtaskName.trim()}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Undo Snackbar */}
      <AnimatePresence>
        {lastDeleted && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 left-6 bg-[#1e293b] text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4"
          >
            <span>List "{lastDeleted.name}" deleted.</span>
            <button
              onClick={handleUndo}
              className="underline text-blue-400 hover:text-purple-400 font-semibold"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

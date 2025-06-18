import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

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
  const [subtasks, setSubtasks] = useState({});
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

  // Handle drag end for both lists and subtasks
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'list') {
      // Handle list reordering
      const sourceIndex = source.index;
      const destinationIndex = destination.index;
      const sourceGlobalIndex = startIndex + sourceIndex;
      const destinationGlobalIndex = startIndex + destinationIndex;

      const newLists = Array.from(lists);
      const [movedItem] = newLists.splice(sourceGlobalIndex, 1);
      newLists.splice(destinationGlobalIndex, 0, movedItem);

      // Update subtasks mapping
      const newSubtasks = {};
      Object.keys(subtasks).forEach(key => {
        const oldIndex = parseInt(key);
        let newIndex = oldIndex;
        
        if (oldIndex === sourceGlobalIndex) {
          newIndex = destinationGlobalIndex;
        } else if (sourceGlobalIndex < destinationGlobalIndex) {
          if (oldIndex > sourceGlobalIndex && oldIndex <= destinationGlobalIndex) {
            newIndex = oldIndex - 1;
          }
        } else {
          if (oldIndex >= destinationGlobalIndex && oldIndex < sourceGlobalIndex) {
            newIndex = oldIndex + 1;
          }
        }
        
        if (subtasks[oldIndex]) {
          newSubtasks[newIndex] = subtasks[oldIndex];
        }
      });
      
      setLists(newLists);
      setSubtasks(newSubtasks);
    } else if (type === 'subtask') {
      // Handle subtask reordering/moving between lists
      const sourceListId = parseInt(source.droppableId.replace('subtasks-', ''));
      const destListId = parseInt(destination.droppableId.replace('subtasks-', ''));
      
      const newSubtasks = { ...subtasks };
      
      if (sourceListId === destListId) {
        // Reordering within the same list
        const listSubtasks = Array.from(newSubtasks[sourceListId] || []);
        const [movedSubtask] = listSubtasks.splice(source.index, 1);
        listSubtasks.splice(destination.index, 0, movedSubtask);
        newSubtasks[sourceListId] = listSubtasks;
      } else {
        // Moving between different lists
        const sourceSubtasks = Array.from(newSubtasks[sourceListId] || []);
        const destSubtasks = Array.from(newSubtasks[destListId] || []);
        
        const [movedSubtask] = sourceSubtasks.splice(source.index, 1);
        destSubtasks.splice(destination.index, 0, movedSubtask);
        
        newSubtasks[sourceListId] = sourceSubtasks;
        newSubtasks[destListId] = destSubtasks;
      }
      
      setSubtasks(newSubtasks);
    }
  };

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

  const handleDelete = () => {
    const { index, name } = listToDelete;
    const newList = [...lists];
    newList.splice(index, 1);
    setLists(newList);
    
    setSubtasks(prev => {
      const newSubtasks = {};
      Object.keys(prev).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          newSubtasks[oldIndex] = prev[oldIndex];
        } else if (oldIndex > index) {
          newSubtasks[oldIndex - 1] = prev[oldIndex];
        }
      });
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

      {/* Animated List Container with Drag and Drop */}
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
            className="w-full"
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="lists" direction="horizontal" type="list">
                {(provided) => (
                  <div
                    className="grid grid-cols-5 gap-6 w-full"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {visibleLists.map((listName, index) => {
                      const globalIndex = startIndex + index;
                      const listSubtasks = subtasks[globalIndex] || [];
                      const completedCount = listSubtasks.filter(task => task.completed).length;
                      
                      return (
                        <Draggable
                          key={`${listName}-${globalIndex}`}
                          draggableId={`list-${globalIndex}`}
                          index={index}
                          type="list"
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => setSelectedIndex(globalIndex)}
                              className={`relative h-[80vh] cursor-pointer rounded-2xl transition-all duration-300 group
                                ${
                                  globalIndex === selectedIndex
                                    ? "border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-origin-border"
                                    : "border border-transparent"
                                }
                                hover:border-[2px] hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-origin-border
                                ${snapshot.isDragging ? "shadow-2xl scale-105 z-50" : ""}
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
                                  : provided.draggableProps.style?.transform
                              }}
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

                              <div className="h-full w-full rounded-[1rem] bg-[#334155] p-4 flex flex-col overflow-hidden">
                                {/* Header section with drag handle */}
                                <div className="flex-shrink-0 flex items-center gap-2 mb-2">
                                  {/* Drag Handle - Only this area allows dragging */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-600 transition-colors"
                                    title="Drag to reorder list"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="text-gray-400"
                                    >
                                      <path d="M9 3h6v6H9zM9 15h6v6H9z"/>
                                      <path d="M3 9h6v6H3zM15 9h6v6h-6z"/>
                                    </svg>
                                  </div>
                                  
                                  <h3 className="text-xl font-semibold text-white flex-1">
                                    {listName}
                                  </h3>
                                </div>
                                
                                {/* Progress indicator */}
                                {listSubtasks.length > 0 && (
                                  <div className="mb-3 flex-shrink-0">
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

                                {/* Subtasks list with drag and drop */}
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  <Droppable droppableId={`subtasks-${globalIndex}`} type="subtask">
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`space-y-2 h-full overflow-y-auto transition-colors duration-200 ${
                                          snapshot.isDraggingOver ? 'bg-blue-500/10 rounded-lg p-1' : ''
                                        }`}
                                      >
                                        {listSubtasks.map((subtask, subtaskIndex) => (
                                          <Draggable
                                            key={subtask.id}
                                            draggableId={`subtask-${subtask.id}`}
                                            index={subtaskIndex}
                                            type="subtask"
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`p-3 rounded-lg bg-[#475569] flex items-start justify-between group/subtask transition-all duration-200
                                                  ${subtask.completed ? 'opacity-60' : ''}
                                                  ${snapshot.isDragging ? 'shadow-lg scale-105 z-50' : ''}
                                                `}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                  ...provided.draggableProps.style,
                                                  transform: snapshot.isDragging 
                                                    ? `${provided.draggableProps.style?.transform} rotate(1deg)` 
                                                    : provided.draggableProps.style?.transform
                                                }}
                                              >
                                                <div className="flex items-start gap-3 flex-1">
                                                  {/* Subtask drag handle */}
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-600 transition-colors opacity-0 group-hover/subtask:opacity-100"
                                                    title="Drag to reorder or move to another list"
                                                  >
                                                    <svg
                                                      width="12"
                                                      height="12"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      className="text-gray-400"
                                                    >
                                                      <path d="M3 12h18M3 6h18M3 18h18"/>
                                                    </svg>
                                                  </div>
                                                  
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
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>

                                {/* Add Task Button */}
                                <div className="flex-shrink-0 mt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentListIndex(globalIndex);
                                      setShowSubtaskModal(true);
                                    }}
                                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                                      rounded-lg text-sm font-medium transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  >
                                    + Add Task
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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

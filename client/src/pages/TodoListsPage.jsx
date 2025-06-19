import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

import TodoList from "../components/TodoList";
import { AddListModal, AddTaskModal, DeleteModal } from "../components/Modals";
import { UndoSnackbar } from "../components/UI";
import SearchBar from "../components/SearchBar/SearchBar";


const dummyLists = [
  "Study for exams",
  "Grocery shopping",
  "Workout routine",
  "Read a book",
  "Plan vacation",
  "Clean the house",
  "Prepare presentation",
  "Organize files",
];

export default function TodoListsPage() {
  const [lists, setLists] = useState(dummyLists);
  const [subtasks, setSubtasks] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [direction, setDirection] = useState(0);
  const [selectedListIndex, setSelectedListIndex] = useState(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [lastDeletedSubtask, setLastDeletedSubtask] = useState(null); // NEW: For subtask undo
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [currentListIndex, setCurrentListIndex] = useState(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskDeadline, setNewSubtaskDeadline] = useState("");

  const undoTimeoutRef = useRef(null);
  const subtaskUndoTimeoutRef = useRef(null); // NEW: For subtask undo timeout
  const highlightTimeoutRef = useRef(null);

  const listsPerPage = 5;
  const totalPages = Math.ceil(lists.length / listsPerPage);
  const startIndex = currentPage * listsPerPage;
  const visibleLists = lists.slice(startIndex, startIndex + listsPerPage);

  // Handle navigation from search
  const handleSearchNavigation = (listIndex, page) => {
    if (page !== currentPage) {
      setDirection(page > currentPage ? 1 : -1);
      setCurrentPage(page);
    }
    
    setSelectedListIndex(listIndex);
    
    clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setSelectedListIndex(null);
    }, 2000);
  };

  // Drag and drop handlers (keeping existing code)
  const onDragEnd = (result) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setTimeout(() => {
      if (type === "list") {
        handleListReorder(source, destination);
      } else if (type === "subtask") {
        handleSubtaskMove(source, destination);
      }
    }, 0);
  };

  const handleListReorder = (source, destination) => {
    const sourceIndex = source.index;
    const destIndex = destination.index;
    const sourceGlobalIndex = startIndex + sourceIndex;
    const destGlobalIndex = startIndex + destIndex;

    if (
      sourceGlobalIndex < 0 ||
      sourceGlobalIndex >= lists.length ||
      destGlobalIndex < 0 ||
      destGlobalIndex >= lists.length
    )
      return;

    const reorderedLists = Array.from(lists);
    const [movedList] = reorderedLists.splice(sourceGlobalIndex, 1);
    reorderedLists.splice(destGlobalIndex, 0, movedList);

    const newSubtasks = {};
    Object.keys(subtasks).forEach((key) => {
      const oldIndex = parseInt(key);
      let newIndex = oldIndex;

      if (oldIndex === sourceGlobalIndex) {
        newIndex = destGlobalIndex;
      } else if (sourceGlobalIndex < destGlobalIndex) {
        if (oldIndex > sourceGlobalIndex && oldIndex <= destGlobalIndex) {
          newIndex = oldIndex - 1;
        }
      } else {
        if (oldIndex >= destGlobalIndex && oldIndex < sourceGlobalIndex) {
          newIndex = oldIndex + 1;
        }
      }

      if (subtasks[oldIndex]) {
        newSubtasks[newIndex] = subtasks[oldIndex];
      }
    });

    setLists(reorderedLists);
    setSubtasks(newSubtasks);
  };

  const handleSubtaskMove = (source, destination) => {
    const sourceListId = parseInt(source.droppableId.replace("subtasks-", ""));
    const destListId = parseInt(
      destination.droppableId.replace("subtasks-", "")
    );
    const newSubtasks = { ...subtasks };

    if (sourceListId === destListId) {
      const listSubtasks = Array.from(newSubtasks[sourceListId] || []);
      const [movedSubtask] = listSubtasks.splice(source.index, 1);
      listSubtasks.splice(destination.index, 0, movedSubtask);
      newSubtasks[sourceListId] = listSubtasks;
    } else {
      const sourceSubtasks = Array.from(newSubtasks[sourceListId] || []);
      const destSubtasks = Array.from(newSubtasks[destListId] || []);
      const [movedSubtask] = sourceSubtasks.splice(source.index, 1);
      destSubtasks.splice(destination.index, 0, movedSubtask);
      newSubtasks[sourceListId] = sourceSubtasks;
      newSubtasks[destListId] = destSubtasks;
    }

    setSubtasks(newSubtasks);
  };

  // List operations
  const addList = () => {
    if (newListName.trim()) {
      setLists((prev) => [...prev, newListName.trim()]);
      setNewListName("");
      setShowAddModal(false);
    }
  };

  const handleDeleteList = (index, name) => {
    setListToDelete({ index, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const { index, name } = listToDelete;
    const deletedListSubtasks = subtasks[index] || [];

    const newList = [...lists];
    newList.splice(index, 1);
    setLists(newList);

    setSubtasks((prev) => {
      const newSubtasks = {};
      Object.keys(prev).forEach((key) => {
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
    setLastDeleted({ name, index, subtasks: deletedListSubtasks });

    clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setLastDeleted(null), 5000);
  };

  const handleUndo = () => {
    if (lastDeleted) {
      const { name, index, subtasks: deletedSubtasks } = lastDeleted;

      const newList = [...lists];
      newList.splice(index, 0, name);
      setLists(newList);

      setSubtasks((prev) => {
        const newSubtasks = {};
        Object.keys(prev).forEach((key) => {
          const currentIndex = parseInt(key);
          if (currentIndex < index) {
            newSubtasks[currentIndex] = prev[currentIndex];
          } else {
            newSubtasks[currentIndex + 1] = prev[currentIndex];
          }
        });
        newSubtasks[index] = deletedSubtasks;
        return newSubtasks;
      });

      setLastDeleted(null);
      clearTimeout(undoTimeoutRef.current);
    }
  };

  // NEW: Subtask undo functionality
  const handleUndoSubtask = () => {
    if (lastDeletedSubtask) {
      const { subtask, listIndex, originalIndex } = lastDeletedSubtask;

      setSubtasks(prev => {
        const currentSubtasks = [...(prev[listIndex] || [])];
        // Insert the subtask back at its original position
        currentSubtasks.splice(originalIndex, 0, subtask);
        
        return {
          ...prev,
          [listIndex]: currentSubtasks
        };
      });

      setLastDeletedSubtask(null);
      clearTimeout(subtaskUndoTimeoutRef.current);
    }
  };

  // Subtask operations
  const handleAddTask = (listIndex) => {
    setCurrentListIndex(listIndex);
    setShowSubtaskModal(true);
  };

  const addSubtask = () => {
    if (newSubtaskName.trim() && currentListIndex !== null) {
      const newSubtask = {
        id: Date.now(),
        name: newSubtaskName.trim(),
        deadline: newSubtaskDeadline || null,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setSubtasks((prev) => ({
        ...prev,
        [currentListIndex]: [...(prev[currentListIndex] || []), newSubtask],
      }));

      setNewSubtaskName("");
      setNewSubtaskDeadline("");
      setShowSubtaskModal(false);
      setCurrentListIndex(null);
    }
  };

  const toggleSubtaskComplete = (listIndex, subtaskId) => {
    setSubtasks((prev) => ({
      ...prev,
      [listIndex]:
        prev[listIndex]?.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        ) || [],
    }));
  };

  // UPDATED: Enhanced deleteSubtask with undo functionality
  const deleteSubtask = (listIndex, subtaskId) => {
    // Clear any existing list undo when deleting a subtask
    setLastDeleted(null);
    clearTimeout(undoTimeoutRef.current);

    setSubtasks((prev) => {
      const currentSubtasks = prev[listIndex] || [];
      const subtaskToDelete = currentSubtasks.find(subtask => subtask.id === subtaskId);
      const originalIndex = currentSubtasks.findIndex(subtask => subtask.id === subtaskId);
      
      if (subtaskToDelete) {
        // Store the deleted subtask for undo
        setLastDeletedSubtask({
          subtask: subtaskToDelete,
          listIndex: listIndex,
          originalIndex: originalIndex,
          listName: lists[listIndex]
        });

        // Set timeout to clear undo option
        clearTimeout(subtaskUndoTimeoutRef.current);
        subtaskUndoTimeoutRef.current = setTimeout(() => {
          setLastDeletedSubtask(null);
        }, 5000);
      }

      return {
        ...prev,
        [listIndex]: currentSubtasks.filter((subtask) => subtask.id !== subtaskId),
      };
    });
  };

  // Navigation
  const changePage = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setDirection(newPage > currentPage ? 1 : -1);
      setCurrentPage(newPage);
      setSelectedListIndex(null);
    }
  };

  const containerVariants = {
    enter: (dir) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -1000 : 1000, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative">
      {/* Header with SearchBar */}
      <div className="flex justify-between items-center px-6 py-4" style={{ position: 'relative', zIndex: 100000 }}>
        <h2 className="text-2xl font-bold">Welcome, Username</h2>
        
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ zIndex: 100000 }}>
          <SearchBar
            lists={lists}
            subtasks={subtasks}
            onNavigateToList={handleSearchNavigation}
            listsPerPage={listsPerPage}
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-300 text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-400"
        >
          + Add List
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 flex items-center relative">
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
            style={{ transform: "none" }}
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="lists" direction="horizontal" type="list">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      transform: "none",
                      display: "grid",
                      gridTemplateColumns:
                        visibleLists.length < 5
                          ? `repeat(${visibleLists.length}, minmax(300px, 320px))`
                          : "repeat(5, 1fr)",
                      gap: "1.5rem",
                      justifyContent: "center",
                      width: "100%",
                      maxWidth:
                        visibleLists.length < 5
                          ? `${visibleLists.length * 350}px`
                          : "100%",
                      margin: "0 auto",
                    }}
                  >
                    {visibleLists.map((listName, index) => {
                      const globalIndex = startIndex + index;
                      const listSubtasks = subtasks[globalIndex] || [];
                      const completedCount = listSubtasks.filter(
                        (task) => task.completed
                      ).length;
                      const isHighlighted = selectedListIndex === globalIndex;

                      return (
                        <TodoList
                          key={`list-${globalIndex}`}
                          listName={listName}
                          globalIndex={globalIndex}
                          index={index}
                          listSubtasks={listSubtasks}
                          completedCount={completedCount}
                          onDelete={handleDeleteList}
                          onAddTask={handleAddTask}
                          onToggleSubtaskComplete={toggleSubtaskComplete}
                          onDeleteSubtask={deleteSubtask}
                          isHighlighted={isHighlighted}
                        />
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

      {/* Modals */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={listToDelete?.name}
      />

      <AddListModal
        isOpen={showAddModal}
        onClose={() => {
          setNewListName("");
          setShowAddModal(false);
        }}
        newListName={newListName}
        setNewListName={setNewListName}
        onAdd={addList}
      />

      <AddTaskModal
        isOpen={showSubtaskModal}
        onClose={() => {
          setNewSubtaskName("");
          setNewSubtaskDeadline("");
          setShowSubtaskModal(false);
          setCurrentListIndex(null);
        }}
        newSubtaskName={newSubtaskName}
        setNewSubtaskName={setNewSubtaskName}
        newSubtaskDeadline={newSubtaskDeadline}
        setNewSubtaskDeadline={setNewSubtaskDeadline}
        onAdd={addSubtask}
      />

      {/* List Undo Snackbar */}
      <UndoSnackbar
        isVisible={!!lastDeleted}
        deletedItemName={lastDeleted?.name}
        onUndo={handleUndo}
      />

      {/* NEW: Subtask Undo Snackbar */}
      <AnimatePresence>
        {lastDeletedSubtask && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 right-6 bg-[#1e293b] text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4"
          >
            <span>Task "{lastDeletedSubtask.subtask.name}" deleted from "{lastDeletedSubtask.listName}".</span>
            <button
              onClick={handleUndoSubtask}
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

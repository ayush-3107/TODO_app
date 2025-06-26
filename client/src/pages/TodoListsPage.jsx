import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import axios from "axios";

import TodoList from "../components/TodoList";
import { AddListModal, AddTaskModal, DeleteModal } from "../components/Modals";
import { UndoSnackbar } from "../components/UI";
import SearchBar from "../components/SearchBar/SearchBar";
import { ProfileIcon, ProfilePage } from "../components/Profile";
import { useAuth } from "../contexts/AuthContext.jsx";
import { listsAPI, tasksAPI } from "../services/api";

export default function TodoListsPage() {
  const { user, logout, changePassword } = useAuth();

  // State for real data from backend
  const [lists, setLists] = useState([]);
  const [subtasks, setSubtasks] = useState({});
  const [listIdMapping, setListIdMapping] = useState({}); // Maps array index to actual list ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [direction, setDirection] = useState(0);
  const [selectedListIndex, setSelectedListIndex] = useState(null);
  const [hoveredListIndex, setHoveredListIndex] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [lastDeletedSubtask, setLastDeletedSubtask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [currentListIndex, setCurrentListIndex] = useState(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskDeadline, setNewSubtaskDeadline] = useState("");

  // AI summarise modal states
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const undoTimeoutRef = useRef(null);
  const subtaskUndoTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  const listsPerPage = 5;
  const totalPages = Math.ceil(lists.length / listsPerPage);
  const startIndex = currentPage * listsPerPage;
  const visibleLists = lists.slice(startIndex, startIndex + listsPerPage);

  // Fetch data from API
  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await listsAPI.getAll();
      const listsData = response.data.data;

      // Create mapping of array index to actual list ID
      const idMapping = {};
      listsData.forEach((list, index) => {
        idMapping[index] = list._id;
      });
      setListIdMapping(idMapping);

      setLists(listsData.map((list) => list.name));

      // Fetch tasks for each list
      const tasksData = {};
      for (let i = 0; i < listsData.length; i++) {
        const list = listsData[i];
        try {
          const tasksResponse = await tasksAPI.getByList(list._id);
          tasksData[i] = tasksResponse.data.data.map((task) => ({
            id: task._id,
            name: task.name,
            completed: task.completed,
            deadline: task.deadline,
            createdAt: task.createdAt,
          }));
        } catch (error) {
          console.error(`Error fetching tasks for list ${list._id}:`, error);
          tasksData[i] = [];
        }
      }

      setSubtasks(tasksData);
      setError(null);
    } catch (error) {
      console.error("Error fetching lists:", error);
      setError("Failed to load lists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // summariser handler
  const handleSummarise = async () => {
    setLoadingSummary(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSummary("You must be logged in to use AI summary.");
        setShowSummary(true);
        setLoadingSummary(false);
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/ai/summarise",
        { prompt: "Summarize my todo productivity" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // withCredentials is only needed if your backend uses cookies for auth
          // withCredentials: true,
        }
      );
      console.log(res);
      setSummary(res.data.summary || "No summary available.");
      setShowSummary(true);
    } catch (e) {
      console.log(e);
      setSummary("Failed to generate summary.");
      setShowSummary(true);
    }
    setLoadingSummary(false);
  };

  // Profile handlers
  const handleChangePassword = async (oldPassword, newPassword) => {
    console.log("Summarise button clicked!");
    try {
      const result = await changePassword({ oldPassword, newPassword });
      if (result.success) {
        alert("Password changed successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Change password error:", error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // COMPLETE DRAG AND DROP IMPLEMENTATION
  const onDragEnd = async (result) => {
    const { destination, source, type } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    console.log("Drag result:", result);

    try {
      if (type === "subtask") {
        // Handle task movement between lists
        await handleTaskMove(source, destination);
      } else if (type === "list") {
        // Handle list reordering (simplified - just local state for now)
        handleListReorderLocal(source, destination);
      }
    } catch (error) {
      console.error("Drag and drop error:", error);
      console.log("Drag operation failed, but continuing...");
    }
  };

  // COMPLETE TASK MOVE FUNCTION WITH COMPREHENSIVE DEBUGGING
  const handleTaskMove = async (source, destination) => {
    const sourceListIndex = parseInt(
      source.droppableId.replace("subtasks-", "")
    );
    const destListIndex = parseInt(
      destination.droppableId.replace("subtasks-", "")
    );

    const sourceListId = listIdMapping[sourceListIndex];
    const destListId = listIdMapping[destListIndex];

    console.log("🔄 DRAG DEBUG - Starting task move:", {
      sourceListIndex,
      destListIndex,
      sourceListId,
      destListId,
      sourceIndex: source.index,
      destIndex: destination.index,
    });

    if (!sourceListId || !destListId) {
      console.error("❌ Could not find list IDs:", {
        sourceListId,
        destListId,
      });
      alert("Error: Could not find list IDs. Please refresh and try again.");
      return;
    }

    // Get the task being moved
    const sourceTasks = [...(subtasks[sourceListIndex] || [])];
    const taskToMove = sourceTasks[source.index];

    if (!taskToMove) {
      console.error("❌ Task not found at index:", source.index);
      alert("Error: Task not found.");
      return;
    }

    console.log("📋 Task to move:", {
      taskId: taskToMove.id,
      taskName: taskToMove.name,
      fromList: lists[sourceListIndex],
      toList: lists[destListIndex],
    });

    // Store original state for rollback
    const originalSubtasks = { ...subtasks };

    // Update local state immediately for better UX
    setSubtasks((prev) => {
      const newSubtasks = { ...prev };

      // Remove from source list
      const newSourceTasks = [...(prev[sourceListIndex] || [])];
      newSourceTasks.splice(source.index, 1);
      newSubtasks[sourceListIndex] = newSourceTasks;

      // Add to destination list
      const newDestTasks = [...(prev[destListIndex] || [])];
      newDestTasks.splice(destination.index, 0, taskToMove);
      newSubtasks[destListIndex] = newDestTasks;

      console.log("🔄 Local state updated");
      return newSubtasks;
    });

    try {
      // If moving between different lists, update the task's list in backend
      if (sourceListIndex !== destListIndex) {
        console.log("📡 Making API call to update task listId...");

        const updateData = {
          listId: destListId, // This should match your backend field expectation
        };

        console.log("📤 Sending update data:", updateData);
        console.log("📤 To endpoint: PUT /api/tasks/" + taskToMove.id);

        const response = await tasksAPI.update(taskToMove.id, updateData);

        console.log("📥 Backend response:", response.data);

        if (response.data.success) {
          console.log("✅ Task listId updated successfully in database");
          console.log("✅ Updated task data:", response.data.data);
        } else {
          throw new Error("Backend returned success: false");
        }

        // Verify the update worked by checking the task in the new list
        setTimeout(async () => {
          try {
            console.log("🔍 Verifying task move...");
            const verifyResponse = await tasksAPI.getByList(destListId);
            const movedTask = verifyResponse.data.data.find(
              (t) => t._id === taskToMove.id
            );

            if (movedTask) {
              console.log(
                "✅ Verification successful - Task found in new list"
              );
              console.log("✅ Task list field:", movedTask.list);
            } else {
              console.log(
                "❌ Verification failed - Task not found in new list"
              );
            }
          } catch (verifyError) {
            console.log("❌ Verification request failed:", verifyError);
          }
        }, 1000);
      } else {
        console.log(
          "🔄 Task moved within same list - no backend update needed"
        );
      }

      console.log(
        `🎉 Task "${taskToMove.name}" successfully moved from "${lists[sourceListIndex]}" to "${lists[destListIndex]}"`
      );
    } catch (error) {
      console.error("❌ Error moving task:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Revert local state on error
      console.log("🔄 Reverting local state due to error...");
      setSubtasks(originalSubtasks);

      // Show user-friendly error message
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      alert(`Failed to move task: ${errorMessage}`);

      // Optional: Refresh data from server to ensure consistency
      setTimeout(() => {
        console.log("🔄 Refreshing data from server...");
        fetchLists();
      }, 1000);
    }
  };

  const handleListReorderLocal = (source, destination) => {
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

    // Update local state only (no backend call for now)
    const reorderedLists = Array.from(lists);
    const [movedList] = reorderedLists.splice(sourceGlobalIndex, 1);
    reorderedLists.splice(destGlobalIndex, 0, movedList);

    // Update subtasks mapping
    const newSubtasks = {};
    const newListIdMapping = {};

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
      if (listIdMapping[oldIndex]) {
        newListIdMapping[newIndex] = listIdMapping[oldIndex];
      }
    });

    setLists(reorderedLists);
    setSubtasks(newSubtasks);
    setListIdMapping(newListIdMapping);

    console.log("Lists reordered locally");
  };

  // Real API calls for CRUD operations
  const addList = async () => {
    if (newListName.trim()) {
      try {
        const response = await listsAPI.create({
          name: newListName.trim(),
          color: "#334155",
        });

        const newList = response.data.data;

        // Update local state
        setLists((prev) => [...prev, newList.name]);
        setSubtasks((prev) => ({ ...prev, [lists.length]: [] }));

        // Update ID mapping
        setListIdMapping((prev) => ({
          ...prev,
          [lists.length]: newList._id,
        }));

        setNewListName("");
        setShowAddModal(false);

        console.log("List created successfully:", newList.name);
      } catch (error) {
        console.error("Error creating list:", error);
        alert(
          `Failed to create list: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }
  };

  const addSubtask = async () => {
    if (newSubtaskName.trim() && currentListIndex !== null) {
      try {
        // Get the actual list ID from our mapping
        const actualListId = listIdMapping[currentListIndex];

        if (!actualListId) {
          alert("Error: Could not find list ID. Please refresh and try again.");
          return;
        }

        const taskData = {
          name: newSubtaskName.trim(),
          listId: actualListId,
          deadline: newSubtaskDeadline || null,
          priority: "medium",
        };

        const response = await tasksAPI.create(taskData);
        const newTask = response.data.data;

        // Add to local state immediately for better UX
        setSubtasks((prev) => ({
          ...prev,
          [currentListIndex]: [
            ...(prev[currentListIndex] || []),
            {
              id: newTask._id,
              name: newTask.name,
              completed: newTask.completed,
              deadline: newTask.deadline,
              createdAt: newTask.createdAt,
            },
          ],
        }));

        // Clear form and close modal
        setNewSubtaskName("");
        setNewSubtaskDeadline("");
        setShowSubtaskModal(false);
        setCurrentListIndex(null);

        console.log("Task created successfully:", newTask);
      } catch (error) {
        console.error("Error creating task:", error);
        alert(
          `Failed to create task: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }
  };

  const handleDeleteList = async (index, name) => {
    try {
      const actualListId = listIdMapping[index];

      if (!actualListId) {
        alert("Error: Could not find list ID. Please refresh and try again.");
        return;
      }

      // Delete from backend
      await listsAPI.delete(actualListId);

      // Update local state
      const deletedListSubtasks = subtasks[index] || [];
      const newList = [...lists];
      newList.splice(index, 1);
      setLists(newList);

      // Update subtasks mapping
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

      // Update ID mapping
      setListIdMapping((prev) => {
        const newMapping = {};
        Object.keys(prev).forEach((key) => {
          const oldIndex = parseInt(key);
          if (oldIndex < index) {
            newMapping[oldIndex] = prev[oldIndex];
          } else if (oldIndex > index) {
            newMapping[oldIndex - 1] = prev[oldIndex];
          }
        });
        return newMapping;
      });

      setLastDeleted({
        name,
        index,
        subtasks: deletedListSubtasks,
        listId: actualListId,
      });

      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => setLastDeleted(null), 5000);

      console.log("List deleted successfully:", name);
    } catch (error) {
      console.error("Error deleting list:", error);
      alert(
        `Failed to delete list: ${error.response?.data?.error || error.message}`
      );
    }
  };

  const confirmDelete = () => {
    if (listToDelete) {
      handleDeleteList(listToDelete.index, listToDelete.name);
      setShowDeleteModal(false);
      setListToDelete(null);
    }
  };

  const handleUndo = async () => {
    if (lastDeleted) {
      try {
        // Recreate the list in the backend
        const response = await listsAPI.create({
          name: lastDeleted.name,
          color: "#334155",
        });

        const restoredList = response.data.data;
        const { name, index } = lastDeleted;

        // Update local state
        const newList = [...lists];
        newList.splice(index, 0, name);
        setLists(newList);

        // Update subtasks
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
          newSubtasks[index] = []; // Start with empty tasks for restored list
          return newSubtasks;
        });

        // Update ID mapping
        setListIdMapping((prev) => {
          const newMapping = {};
          Object.keys(prev).forEach((key) => {
            const currentIndex = parseInt(key);
            if (currentIndex < index) {
              newMapping[currentIndex] = prev[currentIndex];
            } else {
              newMapping[currentIndex + 1] = prev[currentIndex];
            }
          });
          newMapping[index] = restoredList._id;
          return newMapping;
        });

        setLastDeleted(null);
        clearTimeout(undoTimeoutRef.current);

        console.log("List restored successfully:", name);
      } catch (error) {
        console.error("Error restoring list:", error);
        alert("Failed to restore list. Please try again.");
      }
    }
  };

  const handleUndoSubtask = async () => {
    if (lastDeletedSubtask) {
      try {
        const { subtask, listIndex, originalIndex } = lastDeletedSubtask;
        const actualListId = listIdMapping[listIndex];

        // Recreate the task in the backend
        const taskData = {
          name: subtask.name,
          listId: actualListId,
          deadline: subtask.deadline,
          priority: "medium",
        };

        const response = await tasksAPI.create(taskData);
        const restoredTask = response.data.data;

        // Update local state
        setSubtasks((prev) => {
          const currentSubtasks = [...(prev[listIndex] || [])];
          currentSubtasks.splice(originalIndex, 0, {
            id: restoredTask._id,
            name: restoredTask.name,
            completed: restoredTask.completed,
            deadline: restoredTask.deadline,
            createdAt: restoredTask.createdAt,
          });

          return {
            ...prev,
            [listIndex]: currentSubtasks,
          };
        });

        setLastDeletedSubtask(null);
        clearTimeout(subtaskUndoTimeoutRef.current);

        console.log("Task restored successfully:", restoredTask.name);
      } catch (error) {
        console.error("Error restoring task:", error);
        alert("Failed to restore task. Please try again.");
      }
    }
  };

  const handleAddTask = (listIndex) => {
    setCurrentListIndex(listIndex);
    setShowSubtaskModal(true);
  };

  const toggleSubtaskComplete = async (listIndex, subtaskId) => {
    try {
      // Call API to toggle completion
      const response = await tasksAPI.toggle(subtaskId);
      const updatedTask = response.data.data;

      // Update local state
      setSubtasks((prev) => ({
        ...prev,
        [listIndex]:
          prev[listIndex]?.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, completed: updatedTask.completed }
              : subtask
          ) || [],
      }));

      console.log(
        `Task ${updatedTask.completed ? "completed" : "uncompleted"}:`,
        updatedTask.name
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const deleteSubtask = async (listIndex, subtaskId) => {
    try {
      // Clear any existing undo for lists
      setLastDeleted(null);
      clearTimeout(undoTimeoutRef.current);

      // Get the task details before deletion for undo functionality
      const currentSubtasks = subtasks[listIndex] || [];
      const subtaskToDelete = currentSubtasks.find(
        (subtask) => subtask.id === subtaskId
      );
      const originalIndex = currentSubtasks.findIndex(
        (subtask) => subtask.id === subtaskId
      );

      if (!subtaskToDelete) {
        alert("Task not found");
        return;
      }

      // Delete from backend
      await tasksAPI.delete(subtaskId);

      // Update local state
      setSubtasks((prev) => ({
        ...prev,
        [listIndex]: currentSubtasks.filter(
          (subtask) => subtask.id !== subtaskId
        ),
      }));

      // Set up undo functionality
      setLastDeletedSubtask({
        subtask: subtaskToDelete,
        listIndex: listIndex,
        originalIndex: originalIndex,
        listName: lists[listIndex],
      });

      clearTimeout(subtaskUndoTimeoutRef.current);
      subtaskUndoTimeoutRef.current = setTimeout(() => {
        setLastDeletedSubtask(null);
      }, 5000);

      console.log("Task deleted successfully:", subtaskToDelete.name);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleListHover = (listIndex) => {
    setHoveredListIndex(listIndex);
  };

  const handleListLeave = () => {
    setHoveredListIndex(null);
  };

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

  const changePage = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setDirection(newPage > currentPage ? 1 : -1);
      setCurrentPage(newPage);
      setSelectedListIndex(null);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "n") {
        event.preventDefault();
        setShowAddModal(true);
      }

      if (event.ctrlKey && event.shiftKey && event.key === "Backspace") {
        event.preventDefault();
        if (hoveredListIndex !== null) {
          const listName = lists[hoveredListIndex];
          if (listName) {
            setListToDelete({ index: hoveredListIndex, name: listName });
            setShowDeleteModal(true);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hoveredListIndex, lists]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading your todo lists...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchLists}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    enter: (dir) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -1000 : 1000, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative">
      {/* Header with Profile Icon */}
      <div
        className="flex justify-between items-center px-6 py-4"
        style={{ position: "relative", zIndex: 100000 }}
      >
        <div className="flex items-center">
          <ProfileIcon onClick={() => setShowProfile(true)} />
          <h2 className="text-2xl font-bold">
            Welcome, {user?.username || "User"}
          </h2>
        </div>

        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ zIndex: 100000 }}
        >
          <SearchBar
            lists={lists}
            subtasks={subtasks}
            onNavigateToList={handleSearchNavigation}
            listsPerPage={listsPerPage}
          />
        </div>

        <button
          onClick={() => {
            console.log("Add List button clicked!");
            setShowAddModal(true);
          }}
          className="bg-gray-300 text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-400"
          title="Add List (Ctrl + N)"
        >
          + Add List
        </button>
      </div>

      {/* Keyboard shortcuts help text */}
      <div className="px-6 pb-2">
        <p className="text-xs text-gray-400">
          Shortcuts: <kbd className="bg-gray-700 px-1 rounded">Ctrl + N</kbd>{" "}
          Add List,
          <kbd className="bg-gray-700 px-1 rounded ml-1">
            Ctrl + Shift + Backspace
          </kbd>{" "}
          Delete Hovered List
        </p>
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
                      const isHovered = hoveredListIndex === globalIndex;

                      return (
                        <TodoList
                          key={`list-${globalIndex}`}
                          listName={listName}
                          globalIndex={globalIndex}
                          index={index}
                          listSubtasks={listSubtasks}
                          completedCount={completedCount}
                          onDelete={(index, name) => {
                            setListToDelete({ index, name });
                            setShowDeleteModal(true);
                          }}
                          onAddTask={handleAddTask}
                          onToggleSubtaskComplete={toggleSubtaskComplete}
                          onDeleteSubtask={deleteSubtask}
                          isHighlighted={isHighlighted}
                          isHovered={isHovered}
                          onHover={handleListHover}
                          onLeave={handleListLeave}
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

      {/* Summarise Button */}
      <button
        onClick={handleSummarise}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg z-50"
      >
        Summarise
      </button>

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2 text-gray-900">
              Your Productivity Summary
            </h2>
            <p className="text-gray-800 whitespace-pre-line">
              {loadingSummary ? "Loading..." : summary}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowSummary(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

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

      {/* Profile Page */}
      {showProfile && (
        <ProfilePage
          user={user}
          onClose={() => setShowProfile(false)}
          onChangePassword={handleChangePassword}
          onLogout={logout}
        />
      )}

      {/* Undo Snackbars */}
      <UndoSnackbar
        isVisible={!!lastDeleted}
        deletedItemName={lastDeleted?.name}
        onUndo={handleUndo}
      />

      <AnimatePresence>
        {lastDeletedSubtask && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 right-6 bg-[#1e293b] text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4"
          >
            <span>
              Task "{lastDeletedSubtask.subtask.name}" deleted from "
              {lastDeletedSubtask.listName}".
            </span>
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

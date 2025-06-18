import { Draggable, Droppable } from "@hello-pangea/dnd";
import Subtask from "../Subtask";

const TodoList = ({
  listName,
  globalIndex,
  index,
  listSubtasks,
  completedCount,
  selectedIndex,
  onSelect,
  onDelete,
  onAddTask,
  onToggleSubtaskComplete,
  onDeleteSubtask
}) => {
  return (
    <Draggable
      key={`list-${globalIndex}`}
      draggableId={`list-${globalIndex}`}
      index={index}
      type="list"
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onSelect(globalIndex)}
          className={`relative h-[80vh] cursor-pointer rounded-2xl transition-all duration-300 group
            ${
              globalIndex === selectedIndex
                ? "border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-origin-border"
                : "border border-transparent"
            }
            hover:border-[2px] hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-origin-border
            ${snapshot.isDragging ? "shadow-2xl scale-105 z-[9999]" : ""}
          `}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform || ''} rotate(2deg)` 
              : provided.draggableProps.style?.transform || 'none',
            position: snapshot.isDragging ? 'fixed' : 'relative',
            zIndex: snapshot.isDragging ? 9999 : 'auto'
          }}
        >
          {/* Delete Icon */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onDelete(globalIndex, listName);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
              text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1 cursor-pointer z-10"
            title="Delete list"
          >
            ✖
          </div>

          <div className="h-full w-full rounded-[1rem] bg-[#334155] p-4 flex flex-col">
            {/* Header with drag handle */}
            <div className="flex-shrink-0 flex items-center gap-2 mb-2">
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

            {/* Subtasks with drag and drop */}
            <div className="flex-1 min-h-0">
              <Droppable 
                droppableId={`subtasks-${globalIndex}`} 
                type="subtask"
                renderClone={(provided, snapshot, rubric) => (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                    style={{
                      ...provided.draggableProps.style,
                      transform: snapshot.isDragging 
                        ? `${provided.draggableProps.style?.transform || ''} rotate(1deg)` 
                        : provided.draggableProps.style?.transform || 'none'
                    }}
                    className="p-3 rounded-lg bg-[#475569] shadow-lg"
                  >
                    {listSubtasks[rubric.source.index]?.name || 'Task'}
                  </div>
                )}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`h-full overflow-y-auto transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-blue-500/10 rounded-lg p-1' : ''
                    }`}
                    style={{ transform: 'none' }}
                  >
                    <div className="space-y-2">
                      {listSubtasks.map((subtask, subtaskIndex) => (
                        <Subtask
                          key={subtask.id}
                          subtask={subtask}
                          index={subtaskIndex}
                          listIndex={globalIndex}
                          onToggleComplete={onToggleSubtaskComplete}
                          onDelete={onDeleteSubtask}
                        />
                      ))}
                    </div>
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
                  onAddTask(globalIndex);
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
};

export default TodoList;

import { Draggable } from "@hello-pangea/dnd";
import { formatDate, isOverdue } from "../../utils/dateUtils";

const Subtask = ({ 
  subtask, 
  index, 
  listIndex, 
  onToggleComplete, 
  onDelete 
}) => {
  return (
    <Draggable
      key={subtask.id}
      draggableId={`subtask-${subtask.id}`}
      index={index}
      type="subtask"
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-3 rounded-lg bg-[#475569] flex items-start justify-between group/subtask transition-all duration-200
            ${subtask.completed ? 'opacity-60' : ''}
            ${snapshot.isDragging ? 'shadow-lg scale-105 z-[9999]' : ''}
          `}
          onClick={(e) => e.stopPropagation()}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform || ''} rotate(1deg)` 
              : provided.draggableProps.style?.transform || 'none',
            position: snapshot.isDragging ? 'fixed' : 'relative',
            zIndex: snapshot.isDragging ? 9999 : 'auto'
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
              onChange={() => onToggleComplete(listIndex, subtask.id)}
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
            onClick={() => onDelete(listIndex, subtask.id)}
            className="opacity-0 group-hover/subtask:opacity-100 text-red-600 hover:text-red-500 text-sm ml-2 transition-colors duration-200"
            title="Delete subtask"
          >
            ✖
          </button>
        </div>
      )}
    </Draggable>
  );
};

export default Subtask;

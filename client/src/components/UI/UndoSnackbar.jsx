import { motion, AnimatePresence } from "framer-motion";

const UndoSnackbar = ({ 
  isVisible, 
  deletedItemName, 
  onUndo 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 left-6 bg-[#1e293b] text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4"
        >
          <span>List "{deletedItemName}" deleted.</span>
          <button
            onClick={onUndo}
            className="underline text-blue-400 hover:text-purple-400 font-semibold"
          >
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UndoSnackbar;
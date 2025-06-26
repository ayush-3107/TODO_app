import { motion } from "framer-motion";

function parseSummary(summary) {
  return summary
    .split('\n')
    .map(line => line.replace(/^\*+|\s*[\-\*]\s?/g, '').trim())
    .filter(line => line.length > 0);
}

const SummaryModal = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;
  const bullets = parseSummary(summary);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
      >
        <h3 className="text-xl font-bold mb-4">Your Productivity Summary</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          {bullets.length > 0 ? (
            bullets.map((point, idx) => (
              <li key={idx} className="text-base">{point}</li>
            ))
          ) : (
            <li className="text-base text-gray-400">No summary available.</li>
          )}
        </ul>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SummaryModal;
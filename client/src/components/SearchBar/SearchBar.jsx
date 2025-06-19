import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SearchBar = ({ 
  lists, 
  subtasks, 
  onNavigateToList,
  listsPerPage 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search in list names
    lists.forEach((listName, index) => {
      if (listName.toLowerCase().includes(query)) {
        results.push({
          type: 'list',
          name: listName,
          listIndex: index,
          page: Math.floor(index / listsPerPage),
          match: listName
        });
      }
    });

    // Search in subtasks
    Object.keys(subtasks).forEach(listIndex => {
      const listSubtasks = subtasks[listIndex] || [];
      listSubtasks.forEach(subtask => {
        if (subtask.name.toLowerCase().includes(query)) {
          const listName = lists[parseInt(listIndex)];
          if (listName) {
            results.push({
              type: 'task',
              name: subtask.name,
              listName: listName,
              listIndex: parseInt(listIndex),
              page: Math.floor(parseInt(listIndex) / listsPerPage),
              match: subtask.name,
              completed: subtask.completed
            });
          }
        }
      });
    });

    // Sort results by relevance
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(query);
      const bExact = b.name.toLowerCase().startsWith(query);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      if (a.type === 'list' && b.type === 'task') return -1;
      if (a.type === 'task' && b.type === 'list') return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSuggestions(results.slice(0, 8));
    setShowSuggestions(results.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, lists, subtasks, listsPerPage]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onNavigateToList(suggestion.listIndex, suggestion.page);
    searchRef.current?.blur();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400 text-black font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  return (
    // UPDATED: Doubled the length from max-w-6xl to max-w-[96rem] (1536px)
    <div className="relative w-full max-w-[96rem] mx-auto">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
          placeholder="Search lists and tasks..."
          className="w-full px-4 py-3 pl-12 pr-4 bg-[#334155] text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setShowSuggestions(false);
              searchRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions positioned directly below search bar */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-[#1e293b] rounded-xl shadow-2xl border border-gray-600 overflow-hidden max-h-80 overflow-y-auto z-[99999]"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.listIndex}-${suggestion.name}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-700 last:border-b-0 ${
                  index === selectedIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-700 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {suggestion.type === 'list' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                      )}
                      
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        suggestion.type === 'list' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {suggestion.type === 'list' ? 'List' : 'Task'}
                      </span>
                      
                      {suggestion.type === 'task' && suggestion.completed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <div className="font-medium">
                      {highlightMatch(suggestion.name, searchQuery)}
                    </div>
                    
                    {suggestion.type === 'task' && (
                      <div className="text-sm text-gray-400 mt-1">
                        in "{suggestion.listName}"
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 ml-2">
                    Page {suggestion.page + 1}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {showSuggestions && suggestions.length === 0 && searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-[#1e293b] rounded-xl shadow-2xl border border-gray-600 p-4 z-[99999]"
          >
            <div className="text-center text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>No results found for "{searchQuery}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;

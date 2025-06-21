import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChangePasswordModal from './ChangePasswordModal';
import LogoutModal from './LogoutModal';

const ProfilePage = ({ user, onClose, onChangePassword, onLogout }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChangePassword = (oldPassword, newPassword) => {
    // Here you would call your API to change password
    console.log('Changing password...', { oldPassword, newPassword });
    onChangePassword(oldPassword, newPassword);
  };

  const handleLogout = () => {
    setShowLogout(false);
    onLogout();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg w-[90%] max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close Profile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <div className="p-4 bg-[#334155] rounded-lg">
            <p className="text-sm text-gray-400">Username</p>
            <p className="text-lg font-medium">{user.username}</p>
          </div>
          <div className="p-4 bg-[#334155] rounded-lg">
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowChangePassword(true)}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={() => setShowLogout(true)}
            className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>


        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
            onChangePassword={handleChangePassword}
          />
        )}

        {showLogout && (
          <LogoutModal
            onClose={() => setShowLogout(false)}
            onConfirm={handleLogout}
          />
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;

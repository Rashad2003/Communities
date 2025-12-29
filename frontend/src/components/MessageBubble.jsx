import { getUser } from "../utils/auth";
import API from "../api/api";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { FaFileAlt } from "react-icons/fa";
import ReportModal from "./reportModal";

const MessageBubble = ({ message, isMe, isAdmin }) => {
  const user = getUser();
  
  // const isAdmin = group.admins.includes(user._id);
  const canDelete = isAdmin || message.sender._id === user._id;

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePin = async () => {
    await API.post(`/messages/pin/${message._id}`);
  };

  const deleteMessage = async () => {
    await API.delete(`/messages/${message._id}`);
    setShowMenu(false);
  };

  return (
    <div className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2 rounded-lg w-xs mr-[3rem] max-w-xs ${
          isMe ? "bg-secondary text-white" : "bg-white"
        }`}
      >

      <div
        className={`p-2 rounded-lg max-w-xs ${
          isMe ? "bg-secondary text-white" : "bg-white"
        }`}
      >
        {!isMe && (
          <div className="text-xs font-semibold mb-1">
            {message.sender.name}
          </div>
        )}

        {message.type === "text" && (
          <p>{message.content}</p>
        )}

        {message.type === "image" && (
          <img
            src={`http://localhost:4001${message.content}`}
            alt="img"
            className="rounded max-w-full"
          />
        )}

        {message.type === "file" && (
          <a
            href={`http://localhost:4001${message.content}`}
            target="_blank"
          >
          <FaFileAlt className="text-5xl p-1 border rounded-full"/>
          </a>
        )}

        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
        
         <button
          onClick={() => setShowMenu(prev => !prev)}
          className="absolute top-1 right-1 text-xs opacity-60 hover:opacity-100"
        >
          <IoIosArrowDown className="text-xl" />
        </button>
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-6 bg-white border rounded shadow text-sm z-50 w-40"
          >
            {/* PIN / UNPIN */}
            {isAdmin && (
              <button
                onClick={togglePin}
                className="w-full text-left text-black px-3 py-2 hover:bg-gray-100"
              >
                {message.isPinned ? "❌ Unpin" : "📌 Pin"}
              </button>
            )}

            {/* DELETE */}
            {canDelete && (
              <button
                onClick={deleteMessage}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
              >
                🗑️ Delete
              </button>
            )}

            <button
  onClick={() => setShowReport(true)}
  className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
>
  🚩 Report
</button>
            {showReport && (
              <ReportModal message={message} onClose={() => setShowReport(false)} />
            )}

          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MessageBubble;

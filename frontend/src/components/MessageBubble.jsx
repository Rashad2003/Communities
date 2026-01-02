import { getUser } from "../utils/auth";
import API from "../api/api";
import { useEffect, useRef, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { FaFileAlt } from "react-icons/fa";
import ReportModal from "./reportModal";

const MessageBubble = ({ message, isMe, isAdmin, onReply = () => { }, hideReply }) => {
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
        className={`relative p-2 rounded-lg w-xs mr-[3rem] max-w-xs ${isMe ? "bg-secondary text-white" : "bg-white"
          }`}
      >

        <div
          className={`p-2 rounded-lg max-w-xs ${isMe ? "bg-secondary text-white" : "bg-white"
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
              <FaFileAlt className="text-5xl p-1 border rounded-full" />
            </a>
          )}

          {/* 📊 POLL RENDER */}
          {message.type === "poll" && message.pollData && (
            <div className="w-60">
              <div className="font-bold mb-2">{message.pollData.question}</div>
              <div className="flex flex-col gap-2">
                {message.pollData.options.map((opt, idx) => {
                  const voteCount = opt.votes.length;
                  const totalVotes = message.pollData.options.reduce((acc, o) => acc + o.votes.length, 0);
                  const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                  const isVoted = opt.votes.includes(user._id);

                  return (
                    <div
                      key={idx}
                      className="relative border rounded p-2 cursor-pointer hover:bg-gray-50 overflow-hidden"
                      onClick={async () => {
                        await API.post("/messages/vote", {
                          messageId: message._id,
                          optionIndex: idx
                        });
                      }}
                    >
                      {/* Progress Bar Background */}
                      <div
                        className="absolute inset-0 bg-blue-100 opacity-50 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative flex justify-between items-center z-10 text-sm">
                        <div className="flex items-center gap-2">
                          <input
                            type={message.pollData.allowMultiple ? "checkbox" : "radio"}
                            checked={isVoted}
                            readOnly
                            className="accent-primary"
                          />
                          <span className="font-medium text-black">{opt.text}</span>
                        </div>
                        <span className="text-xs text-gray-600">{voteCount} votes ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 📅 EVENT RENDER */}
          {message.type === "event" && message.eventData && (
            <div className="w-60 bg-gray-50 border rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-lg text-black">{message.eventData.title}</div>
                <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold uppercase">
                  {new Date(message.eventData.date).toDateString().split(" ").slice(1, 3).join(" ")}
                </div>
              </div>

              <div className="text-sm text-gray-700 mb-2">{message.eventData.description}</div>

              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                📅 {new Date(message.eventData.date).toLocaleDateString()} at {new Date(message.eventData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                📍 {message.eventData.location}
              </div>

              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {message.eventData.attendees.length} attending
                </span>
                <button
                  onClick={async () => {
                    await API.post("/messages/join-event", { messageId: message._id });
                  }}
                  className={`text-xs px-3 py-1 rounded font-semibold border ${message.eventData.attendees.includes(user._id)
                      ? "bg-white text-green-600 border-green-600"
                      : "bg-green-600 text-white border-transparent"
                    }`}
                >
                  {message.eventData.attendees.includes(user._id) ? "✓ Going" : "Join"}
                </button>
              </div>
            </div>
          )}

          <div className="text-[10px] opacity-60 mt-1 text-right">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>

          {/* Reply Count Indicator */}
          {!hideReply && message.replyCount > 0 && (
            <div onClick={() => onReply(message)} className="text-xs text-blue-500 cursor-pointer mt-1 font-semibold hover:underline">
              {message.replyCount} replies
            </div>
          )}

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


              {!hideReply && (
                <button
                  onClick={() => {
                    onReply(message);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-blue-600 hover:bg-gray-100"
                >
                  ↩️ Reply
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

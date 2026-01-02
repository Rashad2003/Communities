import { useEffect, useRef, useState } from "react";
import API from "../api/api";
import { getUser } from "../utils/auth.js";
import socket from "../socket.js";
import EmojiPicker from "emoji-picker-react";
import { MdOutlineEmojiEmotions, MdEvent } from "react-icons/md";
import { FaPlus, FaImage, FaFileAlt, FaPoll } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { IoIosClose } from "react-icons/io";
import CreatePollModal from "./CreatePollModal";
import CreateEventModal from "./CreateEventModal";

const MessageInput = ({ group, parentId = null }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const isImage = (file) => file && file.type.startsWith("image/");
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const plusMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };


  const user = getUser();
  let typingTimeout;

  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentions, setMentions] = useState([]); // Store User IDs

  const handleTyping = e => {
    const val = e.target.value;
    setText(val);

    const lastWord = val.split(" ").pop();
    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      setMentionSearch(lastWord.slice(1));
    } else {
      setShowMentions(false);
    }

    socket.emit("typing", {
      groupId: group._id,
      user: user.name
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", { groupId: group._id });
    }, 1000);
  };

  const selectMention = (member) => {
    const words = text.split(" ");
    words.pop(); // Remove partial mention
    const newText = words.join(" ") + ` @${member.name} `;
    setText(newText.trimStart());
    setMentions(prev => [...prev, member._id]);
    setShowMentions(false);
  };

  const isAdmin = group.admins?.some(
    admin => admin._id === user._id
  );

  const isBlocked = group.isAnnouncement && !isAdmin;


  const sendMessage = async e => {
    e.preventDefault();

    if (!file && !text.trim()) return;

    const formData = new FormData();
    formData.append("groupId", group._id);
    if (parentId) formData.append("parentId", parentId);

    if (file) {
      formData.append("file", file);
    } else {
      formData.append("type", "text");
      formData.append("content", text);
      mentions.forEach(id => formData.append("mentions[]", id)); // Send mentions
    }

    await API.post("/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    setText("");
    setFile(null);
    socket.emit("stopTyping", { groupId: group._id });
  };

  return (
    <div>
      {/* MODALS */}
      {showPollModal && <CreatePollModal groupId={group._id} onClose={() => setShowPollModal(false)} />}
      {showEventModal && <CreateEventModal groupId={group._id} onClose={() => setShowEventModal(false)} />}

      {/* FILE PREVIEW */}
      {/* FILE PREVIEW */}
      {file && (
        <div className="p-4 border-t bg-gray-50 flex items-center gap-4 animate-fade-in">
          {isImage(file) ? (
            <div className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-24 h-24 object-cover rounded-xl shadow-md border"
              />
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
              >
                <IoIosClose className="text-lg" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm w-full max-w-xs relative">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <FaFileAlt className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-gray-800">{file.name}</div>
                <div className="text-xs text-gray-500 font-medium">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <IoIosClose className="text-2xl" />
              </button>
            </div>
          )}
        </div>
      )}
      {/* EMOJI PICKER */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-20 left-4 z-50"
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            height={350}
            width={300}
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      <form
        onSubmit={sendMessage}
        className="p-1 bg-white border flex w-full mx-auto relative"
      >
        {/* MENTION SUGGESTIONS */}
        {showMentions && (
          <div className="absolute bottom-16 left-14 bg-white border shadow-lg rounded-lg w-48 max-h-40 overflow-y-auto z-50">
            {group.members
              .filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
              .map(member => (
                <div
                  key={member._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm font-medium flex items-center gap-2"
                  onClick={() => selectMention(member)}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                    {member.name.charAt(0)}
                  </div>
                  {member.name}
                </div>
              ))}
          </div>
        )}

        {/* PLUS MENU */}
        {showPlusMenu && (
          <div ref={plusMenuRef} className="absolute bottom-14 left-10 bg-white shadow-xl border rounded-lg p-2 z-50 flex flex-col gap-2 w-40">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left"
              onClick={() => {
                document.getElementById("fileInput").setAttribute("accept", "image/*");
                document.getElementById("fileInput").click();
                setShowPlusMenu(false);
              }}
            >
              <FaImage className="text-purple-500 text-lg" />
              <span>Image</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left"
              onClick={() => {
                document.getElementById("fileInput").removeAttribute("accept");
                document.getElementById("fileInput").click();
                setShowPlusMenu(false);
              }}
            >
              <FaFileAlt className="text-blue-500 text-lg" />
              <span>Document</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left"
              onClick={() => {
                setShowPollModal(true);
                setShowPlusMenu(false);
              }}
            >
              <FaPoll className="text-green-500 text-lg" />
              <span>Poll</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left"
              onClick={() => {
                setShowEventModal(true);
                setShowPlusMenu(false);
              }}
            >
              <MdEvent className="text-red-500 text-xl" />
              <span>Event</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowEmoji(prev => !prev)}
          className="px-1 md:px-3 text-2xl"
        >
          <MdOutlineEmojiEmotions />
        </button>

        <input
          type="file"
          hidden
          id="fileInput"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          type="button"
          onClick={() => setShowPlusMenu(prev => !prev)}
          className="px-1 md:px-3 text-xl transition-transform hover:rotate-90"
        >
          <FaPlus />
        </button>


        <input
          disabled={!!file}
          className={`flex-1 rounded-full outline-none px-2 md:px-4 py-2 ${file ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          placeholder={file ? "Send file..." : "Type a message (@ to mention)"}
          value={text}
          onChange={handleTyping}
        />

        <button
          disabled={isBlocked}
          className={`px-1 md:px-4 py-2 text-xl rounded-full text-white ${isBlocked ? "bg-gray-400" : "bg-secondary"
            }`}
        >
          <IoMdSend />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

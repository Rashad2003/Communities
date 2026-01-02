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

  const handleTyping = e => {
    setText(e.target.value);

    socket.emit("typing", {
      groupId: group._id,
      user: user.name
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", { groupId: group._id });
    }, 1000);
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
      {file && (
        <div className="p-3 border-t bg-gray-50 flex items-center gap-3">

          {isImage(file) ? (
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-20 h-20 object-cover rounded"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setFile(null)}
            className="ml-auto text-red-500 text-4xl"
          >
            <IoIosClose />
          </button>
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
          placeholder={file ? "Send file..." : "Type a message"}
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

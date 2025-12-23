import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { getUser } from "../utils/auth";
import socket from "../socket.js";
import { IoIosArrowDown } from "react-icons/io";

const ChatWindow = ({ group, setGroups, communityAdmins, setActiveGroup }) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const user = getUser();
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);
const messagesContainerRef = useRef(null);
const [showScrollDown, setShowScrollDown] = useState(false);
const [pinnedMessage, setPinnedMessage] = useState(null);
const [showMenu, setShowMenu] = useState(false);
const menuRef = useRef(null);

const isCommunityAdmin = communityAdmins.some(
  admin => admin._id === user._id
);

const isMember = group.members.some(
  m => m._id === user._id
);

if (
  !group.isAnnouncement &&
  !isCommunityAdmin &&
  !isMember
) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      Request admin approval to access this group
    </div>
  );
}


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


const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};


  const fetchMessages = async () => {
    const res = await API.get(`/messages/${group._id}`);
    setMessages(res.data);
  };

  useEffect(() => {
    fetchMessages();
  }, [group]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const isAtBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      50;

    setShowScrollDown(!isAtBottom);
  };

  container.addEventListener("scroll", handleScroll);
  return () =>
    container.removeEventListener("scroll", handleScroll);
}, []);


  useEffect(() => {
    if (!group?._id) return;
    socket.emit("joinGroup", group._id);
    fetchMessages();
  }, [group._id]);

  useEffect(() => {
  if (!group?._id) return;

  const handleNewMessage = (msg) => {
    console.log("📩 Real-time message:", msg);

    if (msg.groupId === group._id) {
      setMessages(prev => [...prev, msg]);
    }
  };

  socket.on("newMessage", handleNewMessage);

  return () => {
    socket.off("newMessage", handleNewMessage);
  };
}, [group._id]);


  useEffect(() => {
    socket.on("typing", user => {
      setTypingUser(user);
    });
  
    socket.on("stopTyping", () => {
      setTypingUser("");
    });
  
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);
  
// 1️⃣ Fetch pinned message ONCE when group changes
useEffect(() => {
  if (!group?._id) return;

  API.get(`/messages/pinned/${group._id}`)
    .then(res => setPinnedMessage(res.data));
}, [group._id]);


// 2️⃣ Join socket room ONCE per group
useEffect(() => {
  if (!group?._id) return;

  socket.emit("joinGroup", group._id);

  return () => {
    socket.emit("leaveGroup", group._id);
  };
}, [group._id]);


// 3️⃣ SINGLE realtime pin listener
useEffect(() => {
  if (!group?._id) return;

  const handlePinUpdated = ({ groupId, pinnedMessage }) => {
    if (groupId === group._id) {
      setPinnedMessage(pinnedMessage);
    }
  };

  socket.on("pinUpdated", handlePinUpdated);

  return () => {
    socket.off("pinUpdated", handlePinUpdated);
  };
}, [group._id]);



useEffect(() => {
  socket.on("messageDeleted", ({ messageId }) => {
    setMessages(prev =>
      prev.filter(m => m._id !== messageId)
    );
  });

  return () => socket.off("messageDeleted");
}, []);

useEffect(() => {
  socket.on("chatCleared", () => {
    setMessages([]);
  });

  return () => socket.off("chatCleared");
}, []);

useEffect(() => {
  socket.on("groupDeleted", ({ groupId }) => {
    setGroups(prev => prev.filter(g => g._id !== groupId));
    setActiveGroup(null);
  });

  return () => socket.off("groupDeleted");
}, []);



  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a group to start chatting
      </div>
    );
  }

      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No messages yet
        </div>
      )}

  return (
    <div className="flex-1 flex flex-col relative overflow-y-hidden">
      {/* Chat Header */}
      <div className="bg-primary text-white p-4 font-semibold flex items-center justify-between">
        {group.name}
        {/* {group.isAnnouncement && (
          <span className="text-sm ml-2">(Announcements)</span>
        )} */}
         {isCommunityAdmin && (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(prev => !prev)}
        className="text-xl px-2"
      >
        ⋮
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 bg-white text-black border rounded shadow w-48 z-50">
          
          <button
            onClick={async () => {
              await API.delete(`/messages/clear/${group._id}`);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            🧹 Clear chat
          </button>

          <button
            onClick={async () => {
              if (!confirm("Delete this group permanently?")) return;

              await API.delete(`/groups/${group._id}`);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            🗑️ Delete group
          </button>

        </div>
      )}
    </div>
  )}
      </div>
      {pinnedMessage && (
  <div className="bg-yellow-100 border-b px-4 py-2 flex items-center gap-2">
    <span>📌</span>
    <span className="text-sm truncate">
      {pinnedMessage.type === "text"
        ? pinnedMessage.content
        : "Pinned attachment"}
    </span>
  </div>
)}


      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-100 bg-[url(abc.webp)]">
        {messages.map(msg => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isMe={msg.sender._id === user._id}
            group={group}
            isAdmin={isCommunityAdmin}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      

      {typingUser && (
  <div className="text-xs text-gray-500 px-4 pb-1">
    {typingUser} is typing...
  </div>
)}

{showScrollDown && (
  <button
    onClick={scrollToBottom}
    className="absolute bottom-20 right-6 text-xl bg-white shadow-lg border rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
  >
    <IoIosArrowDown />
  </button>
)}

     {!(
  group.isAnnouncement && !isCommunityAdmin
) && (
  <MessageInput group={group} />
)}

      <div ref={bottomRef} />
    </div>
    
  );
};

export default ChatWindow;

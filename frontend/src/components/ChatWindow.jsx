import { useEffect, useState, useRef, useLayoutEffect } from "react";
import API from "../api/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { getUser } from "../utils/auth";
import socket from "../socket.js";
import { IoIosArrowDown } from "react-icons/io";
import { IoMdArrowBack } from "react-icons/io";
import GroupInfoModal from "./GroupInfoModal.jsx";
import ThreadView from "./ThreadView.jsx";
import { FaInfoCircle, FaFolderOpen } from "react-icons/fa";
import ResourcesModal from "./ResourcesModal.jsx";

const ChatWindow = ({ group, groups, setGroups, communityAdmins, setActiveGroup, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const user = getUser();
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const menuRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const previousHeightRef = useRef(null);

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


  const fetchMessages = async (before = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = before
        ? `/messages/${group._id}?before=${before}`
        : `/messages/${group._id}`;

      const res = await API.get(url);
      const newMessages = res.data;

      if (newMessages.length < 20) {
        setHasMore(false);
      }

      if (before) {
        if (messagesContainerRef.current) {
          previousHeightRef.current = messagesContainerRef.current.scrollHeight;
        }
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
        setHasMore(newMessages.length === 20); // Reset hasMore on fresh load
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    if (previousHeightRef.current !== null && messagesContainerRef.current) {
      const newHeight = messagesContainerRef.current.scrollHeight;
      const oldHeight = previousHeightRef.current;
      const diff = newHeight - oldHeight;
      messagesContainerRef.current.scrollTop = diff;
      previousHeightRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    // Reset state on group change
    setMessages([]);
    setHasMore(true);
    fetchMessages();
  }, [group._id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // 1. Show/Hide "Scroll to Bottom" button
      const isAtBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
        100;

      setShowScrollDown(!isAtBottom);

      // 2. Infinite Scroll (Load More)
      if (container.scrollTop === 0 && hasMore && !loading && messages.length > 0) {
        const firstMessage = messages[0];
        fetchMessages(firstMessage.createdAt);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () =>
      container.removeEventListener("scroll", handleScroll);
  }, [group._id, hasMore, loading, messages]);


  useEffect(() => {
    if (!group?._id) return;

    // Mark as read in backend
    API.post(`/groups/${group._id}/read`);

    // Update local state to clear badge (in parent)
    setGroups(prev => prev.map(g =>
      g._id === group._id ? { ...g, unreadCount: 0 } : g
    ));

    // fetchMessages(); // Removed redundant call
  }, [group._id]);

  useEffect(() => {
    if (!group?._id) return;

    const handleNewMessage = (msg) => {
      console.log("📩 Real-time message:", msg);

      if (msg.groupId === group._id) {
        if (msg.parentId) {
          // It's a reply -> Update parent message reply count
          setMessages(prev =>
            prev.map(m =>
              m._id === msg.parentId
                ? { ...m, replyCount: (m.replyCount || 0) + 1 }
                : m
            )
          );
        } else {
          // It's a top-level message -> Add to list
          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;

            // If user is at bottom, auto-scroll will happen via useEffect dependency on messages
            return [...prev, msg];
          });

          // Only scroll to bottom if user was already at bottom or it's my message
          if (msg.sender._id === user._id) {
            setTimeout(scrollToBottom, 100);
          }
        }
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

    // const handlePinUpdated = ({ groupId, pinnedMessage, data }) => {
    //   if (data.groupId === group._id) {
    //     setPinnedMessage(pinnedMessage);
    //   }
    // };

    const handlePinUpdated = (data) => {
      if (!data || !data.groupId) return;

      if (data.groupId !== group._id) return;

      // 1️⃣ Update pinned banner
      setPinnedMessage(data.pinnedMessage ?? null);

      // 2️⃣ Update messages list (THIS FIXES ICON)
      setMessages(prev =>
        prev.map(msg => {
          // unpin all messages
          if (!data.pinnedMessage) {
            return { ...msg, isPinned: false };
          }

          // pin only the selected message
          if (msg._id === data.pinnedMessage._id) {
            return { ...msg, isPinned: true };
          }

          return { ...msg, isPinned: false };
        })
      );
    };


    socket.on("pinUpdated", handlePinUpdated);

    return () => {
      socket.off("pinUpdated", handlePinUpdated);
    };
  }, [group._id]);



  useEffect(() => {
    socket.on("messageDeleted", ({ messageId, parentId }) => {
      setMessages(prev => {
        if (parentId) {
          // It was a reply -> Decrement reply count of parent
          return prev.map(m =>
            m._id === parentId
              ? { ...m, replyCount: Math.max(0, (m.replyCount || 0) - 1) }
              : m
          );
        }
        // Top-level message -> Remove
        return prev.filter(m => m._id !== messageId);
      });
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

    socket.on("memberRemoved", ({ groupId, userId }) => {
      if (groupId === group._id && userId === user._id) {
        setActiveGroup(null); // Kick user out of view
      }
    });

    return () => {
      socket.off("groupDeleted");
      socket.off("memberRemoved");
    };
  }, [group._id]);

  useEffect(() => {
    const handlePollUpdated = ({ messageId, pollData }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, pollData } : msg
        )
      );
    };

    const handleEventUpdated = ({ messageId, eventData }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, eventData } : msg
        )
      );
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    };

    socket.on("pollUpdated", handlePollUpdated);
    socket.on("eventUpdated", handleEventUpdated);
    socket.on("reactionUpdated", handleReactionUpdated);

    return () => {
      socket.off("pollUpdated", handlePollUpdated);
      socket.off("eventUpdated", handleEventUpdated);
      socket.off("reactionUpdated", handleReactionUpdated);
    };
  }, []);



  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a group to start chatting
      </div>
    );
  }

  {
    messages.length === 0 && (
      <div className="text-center text-gray-500 mt-10">
        No messages yet
      </div>
    )
  }

  //       if (!group.isAnnouncement && !isMember) {
  //   return (
  //     <div className="flex items-center justify-center h-full text-gray-500">
  //       You are no longer a member of this group
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden">
      <div className="flex-1 flex flex-col relative overflow-y-hidden">
        {/* Chat Header */}
        <div className="bg-primary text-white p-4 font-semibold flex items-center justify-between">
          {isMobile && (
            <button
              onClick={() => setActiveGroup(null)}
              className="text-2xl"
            >
              <IoMdArrowBack />
            </button>
          )}

          <h2 className="font-semibold text-lg flex-1">
            {group.name}
          </h2>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="text-xl px-2"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white text-black border rounded shadow w-48 z-50">

                {isCommunityAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setShowGroupInfo(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FaInfoCircle /> Group Info
                    </button>

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
                  </>
                )}
                <button
                  onClick={() => {
                    setShowResources(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaFolderOpen /> Class Resources
                </button>

              </div>
            )}
          </div>
          {showGroupInfo && (
            <GroupInfoModal
              groupId={group._id}
              group1={group}
              groups={groups}
              onClose={() => setShowGroupInfo(false)}
            />
          )}
          {showResources && (
            <ResourcesModal
              groupId={group._id}
              onClose={() => setShowResources(false)}
            />
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
          {loading && (
            <div className="flex justify-center p-2">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {messages.map((msg, index) => {
            const currentDate = new Date(msg.createdAt).toDateString();
            const prevDate =
              index > 0
                ? new Date(messages[index - 1].createdAt).toDateString()
                : null;
            const showDateHeader = currentDate !== prevDate;

            const formatDateLabel = (date) => {
              const today = new Date().toDateString();
              const yesterday = new Date(Date.now() - 86400000).toDateString();
              if (date === today) return "Today";
              if (date === yesterday) return "Yesterday";
              return date;
            };

            return (
              <div key={msg._id}>
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDateLabel(currentDate)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMe={msg.sender._id === user._id}
                  group={group}
                  isAdmin={isCommunityAdmin}
                  onReply={(msg) => {
                    console.log("Setting active thread:", msg);
                    setActiveThread(msg);
                  }}
                />
              </div>
            );
          })}
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

      {activeThread && (
        <ThreadView
          parentMessage={activeThread}
          onClose={() => setActiveThread(null)}
          group={group}
        />
      )}
    </div>
  );
};

export default ChatWindow;

import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { IoMdClose } from "react-icons/io";
import socket from "../socket";

const ThreadView = ({ parentMessage, onClose, group }) => {
    const [replies, setReplies] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchReplies = async () => {
            const res = await API.get(`/messages/thread/${parentMessage._id}`);
            setReplies(res.data);
        };
        fetchReplies();
    }, [parentMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [replies]);

    useEffect(() => {
        const handleNewMessage = (msg) => {
            if (msg.parentId === parentMessage._id) {
                setReplies((prev) => [...prev, msg]);
            }
        };
        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [parentMessage._id]);

    useEffect(() => {
        const handleMessageDeleted = ({ messageId, parentId }) => {
            if (parentId === parentMessage._id) {
                setReplies((prev) => prev.filter((msg) => msg._id !== messageId));
            }
        };

        const handlePollUpdated = ({ messageId, pollData }) => {
            setReplies(prev => prev.map(msg => msg._id === messageId ? { ...msg, pollData } : msg));
        };

        const handleEventUpdated = ({ messageId, eventData }) => {
            setReplies(prev => prev.map(msg => msg._id === messageId ? { ...msg, eventData } : msg));
        };

        const handleReactionUpdated = ({ messageId, reactions }) => {
            setReplies(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg));
        };

        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("pollUpdated", handlePollUpdated);
        socket.on("eventUpdated", handleEventUpdated);
        socket.on("reactionUpdated", handleReactionUpdated);

        return () => {
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("pollUpdated", handlePollUpdated);
            socket.off("eventUpdated", handleEventUpdated);
            socket.off("reactionUpdated", handleReactionUpdated);
        };
    }, [parentMessage._id]);

    return (
        <div className="w-full lg:w-1/3 border-l border-gray-300 flex flex-col bg-white h-full shadow-xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-lg">Reply</h3>
                <button onClick={onClose} className="text-xl text-gray-500 hover:text-black">
                    <IoMdClose />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                {/* Parent Message */}
                <div className="mb-6 opacity-80 scale-95 origin-left">
                    <MessageBubble message={parentMessage} isMe={false} isAdmin={false} hideReply={true} />
                </div>

                <div className="border-t border-gray-300 my-4" />

                {/* Replies */}
                {replies.map((reply) => (
                    <MessageBubble
                        key={reply._id}
                        message={reply}
                        isMe={reply.sender._id === parentMessage.sender._id}
                        isAdmin={false} // Simplify for now
                        hideReply={true}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-2 border-t">
                <MessageInput group={group} parentId={parentMessage._id} />
            </div>
        </div>
    );
};

export default ThreadView;

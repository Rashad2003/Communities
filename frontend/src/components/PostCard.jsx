import { useState } from "react";
import API from "../api/api";
import { getUser } from "../utils/auth";

const PostCard = ({ post, refresh }) => {
  const user = getUser();
  const [comments, setComments] = useState([]);
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  const liked = post.likes.includes(user._id);

  const toggleLike = async () => {
    await API.put(`/posts/like/${post._id}`);
    refresh();
  };

  const fetchComments = async () => {
    const res = await API.get(`/comments/${post._id}`);
    setComments(res.data);
    setShow(!show);
  };

  const addComment = async () => {
    await API.post("/comments", {
      content: text,
      postId: post._id
    });
    setText("");
    fetchComments();
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4">
      <p>{post.content}</p>

      <div className="flex gap-6 mt-3 text-sm">
        <button
          onClick={toggleLike}
          className={`font-semibold ${
            liked ? "text-red-500" : "text-gray-500"
          }`}
        >
          ❤️ {post.likes.length}
        </button>

        <button
          onClick={fetchComments}
          className="text-secondary font-semibold"
        >
          💬 Comment
        </button>
      </div>

      {show && (
        <div className="mt-4">
          {comments.map(c => (
            <div key={c._id} className="text-sm mb-2">
              <span className="font-semibold">{c.author.name}:</span>{" "}
              {c.content}
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 border p-2 rounded-md"
              placeholder="Write a comment..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button
              onClick={addComment}
              className="bg-secondary text-white px-3 rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;

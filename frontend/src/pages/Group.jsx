import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";
import { getUser } from "../utils/auth";
import { Navigate } from "react-router-dom";
import PostCard from "../components/PostCard";


const Group = () => {
  const { id } = useParams();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const user = getUser();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await API.get(`/groups/${id}`);
        setGroup(res.data);
      } catch (err) {
        setError("You must join this group to view content");
      }
    };

    fetchGroup();
  }, [id]);

  const fetchPosts = async () => {
    const res = await API.get(`/posts/${id}`);
    setPosts(Array.isArray(res.data) ? res.data : []);
  };
  

  useEffect(() => {
    fetchPosts();
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh]">
        <p className="text-red-600 text-lg font-semibold mb-4">
          {error}
        </p>
        <Navigate to="/community" />
      </div>
    );
  }

  if (!group) return null;

  const createPost = async () => {
    await API.post("/posts", { content, groupId: id });
    setContent("");
    const res = await API.get(`/posts/${id}`);
    setPosts(res.data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-primary text-2xl font-bold mb-2">
        {group.name}
      </h2>
      <p className="text-gray-600 mb-6">
        {group.description}
      </p>
      <div className="mb-6">
        <textarea
          className="w-full p-3 border rounded-lg"
          placeholder="Write something..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button
          onClick={createPost}
          className="mt-2 bg-secondary text-white px-4 py-2 rounded-md"
        >
          Post
        </button>
      </div>

      {posts.map(post => (
  <PostCard
    key={post._id}
    post={post}
    refresh={fetchPosts}
  />
))}
    </div>
  );
};

export default Group;

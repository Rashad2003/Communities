import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const createGroup = async e => {
    e.preventDefault();
    await API.post("/groups", { name, description });
    navigate("/community");
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form
        onSubmit={createGroup}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-primary text-2xl font-bold mb-6 text-center">
          Create Group
        </h2>

        <input
          className="w-full mb-4 p-2 border rounded-md"
          placeholder="Group Name"
          onChange={e => setName(e.target.value)}
          required
        />

        <textarea
          className="w-full mb-6 p-2 border rounded-md"
          placeholder="Description"
          onChange={e => setDescription(e.target.value)}
          required
        />

        <button className="w-full bg-secondary text-white py-2 rounded-md">
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;

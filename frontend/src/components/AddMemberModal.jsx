import { useEffect, useState } from "react";
import API from "../api/api";

const AddMemberModal = ({ group, onClose }) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    API.get("/auth").then(res => {
      // exclude existing members
      const memberIds = group.members.map(m => m._id);
      setStudents(
        res.data.filter(u => !memberIds.includes(u._id))
      );
    });
  }, [group]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded-lg p-4 max-h-[80vh] overflow-y-auto">

        <h2 className="text-lg font-semibold mb-3">
          Add Member
        </h2>

        <input
          type="text"
          placeholder="Search student"
          className="w-full border p-2 rounded mb-3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filtered.map(student => (
          <div
            key={student._id}
            className="flex justify-between items-center p-2 border-b"
          >
            <span>{student.name}</span>

            <button
              onClick={async () => {
                await API.post(
                  `/groups/${group._id}/add/${student._id}`
                );
                onClose(); // socket updates UI
              }}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Add
            </button>
          </div>
        ))}

        <div className="text-right mt-3">
          <button onClick={onClose} className="text-gray-600">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddMemberModal;

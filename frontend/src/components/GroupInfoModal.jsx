import { BsThreeDotsVertical } from "react-icons/bs";
import { getUser } from "../utils/auth";
import API from "../api/api";
import { useState } from "react";

const GroupInfoModal = ({ group, onClose }) => {
  const user = getUser();
  const isAdmin = group.admins.some(a => a._id === user._id);
  const [openMenu, setOpenMenu] = useState(null);

  const removeMember = async (memberId) => {
    await API.post(`/groups/${group._id}/remove/${memberId}`);
    setOpenMenu(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-96 rounded-lg p-4 max-h-[80vh] overflow-y-auto text-black">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Group Info</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* GROUP NAME */}
        <div className="mb-2 text-3xl">
          <p className="font-semibold text-center">{group.name}</p>
        </div>

        {/* GROUP BIO */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">About</p>
          <p>{group.bio || "No description"}</p>
        </div>

        {/* MEMBERS */}
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Members ({group.members.length})
          </p>

          {group.members.map(member => (
            <div
              key={member._id}
              className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
            >
              <span>{member.name}</span>

              {isAdmin && member._id !== user._id && (
                <div className="relative">
                  <button onClick={() => setOpenMenu(member._id)}>
                    <BsThreeDotsVertical />
                  </button>

                  {openMenu === member._id && (
                    <div className="absolute right-0 bg-white border rounded shadow z-50">
                      <button
                        onClick={() => removeMember(member._id)}
                        className="px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default GroupInfoModal;

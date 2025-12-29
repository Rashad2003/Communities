import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import socket from "../socket";
import { getUser } from "../utils/auth";

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const user = getUser();

const communityAdmin =
  groups.find(g => g.isAnnouncement)?.admins || [];

  useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);


  useEffect(() => {
  const fetchGroups = async () => {
    const res = await API.get("/groups");
    const groupsData = res.data || [];

    setGroups(groupsData);

    // 🔥 ALWAYS OPEN ANNOUNCEMENT GROUP
    const announcementGroup = groupsData.find(
      g => g.isAnnouncement
    );

    if (announcementGroup) {
      setActiveGroup(announcementGroup);
    }
  };

  fetchGroups();

  socket.on("connect", fetchGroups);

  return () => {
    socket.off("connect", fetchGroups);
  };
}, []);


useEffect(() => {
  const handleGroupDeleted = ({ groupId }) => {
    // 1️⃣ Remove group from list
    setGroups(prev => prev.filter(g => g._id !== groupId));

    // 2️⃣ If current group deleted → go to announcement
    setActiveGroup(prev => {
      if (!prev || prev._id !== groupId) return prev;

      return (
        groups.find(g => g.isAnnouncement) || null
      );
    });
  };

  socket.on("groupDeleted", handleGroupDeleted);

  return () => {
    socket.off("groupDeleted", handleGroupDeleted);
  };
}, [groups]);

useEffect(() => {
  socket.on("joinRequested", ({ groupId, user }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              pendingRequests: [...g.pendingRequests, user]
            }
          : g
      )
    );
  });

  return () => socket.off("joinRequested");
}, []);

useEffect(() => {
  socket.on("requestApproved", ({ groupId, user }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              members: [...g.members, user],
              pendingRequests: g.pendingRequests.filter(
                p => p._id !== user._id
              )
            }
          : g
      )
    );
  });

  return () => socket.off("requestApproved");
}, []);


useEffect(() => {
  socket.on("requestRejected", ({ groupId, userId }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              pendingRequests: g.pendingRequests.filter(
                p => p._id !== userId
              )
            }
          : g
      )
    );
  });

  return () => socket.off("requestRejected");
}, []);

useEffect(() => {
  socket.on("requestApproved", ({ userId, groupName }) => {
    if (userId === user._id) {
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Your request to join "${groupName}" was approved`,
          type: "approved"
        },
        ...prev
      ]);
    }
  });

  socket.on("requestRejected", ({ userId, groupName }) => {
    if (userId === user._id) {
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Your request to join "${groupName}" was rejected`,
          type: "rejected"
        },
        ...prev
      ]);
    }
  });

  return () => {
    socket.off("requestApproved");
    socket.off("requestRejected");
  };
}, []);


useEffect(() => {
  socket.on("groupCreated", newGroup => {
    setGroups(prev => {
      // avoid duplicates
      if (prev.some(g => g._id === newGroup._id)) return prev;
      return [...prev, newGroup];
    });
  });

  return () => socket.off("groupCreated");
}, []);

useEffect(() => {
  const handleMemberRemoved = ({ groupId, userId }) => {
    console.log("🔥 MEMBER REMOVED RECEIVED", groupId, userId);

    // update groups
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              members: g.members.filter(m => m._id !== userId)
            }
          : g
      )
    );

    // if current user removed → kick out
    if (userId === user._id) {
      setActiveGroup(prev =>
        prev?._id === groupId ? null : prev
      );
    }
  };

  socket.on("memberRemoved", handleMemberRemoved);

  return () => {
    socket.off("memberRemoved", handleMemberRemoved);
  };
}, [user._id, groups, activeGroup]);


useEffect(() => {
  socket.on("memberAdded", ({ groupId, user }) => {
    setGroups(prev =>
      prev.map(g => {
        if (g._id !== groupId) return g;

        // 🔥 PREVENT DUPLICATES + ENSURE FULL OBJECT
        const exists = g.members.some(
          m => m._id === user._id
        );

        if (exists) return g;

        return {
          ...g,
          members: [...g.members, user]
        };
      })
    );
  });

  return () => socket.off("memberAdded");
}, []);

useEffect(() => {
  if (!user?._id) return;

  socket.emit("joinUser", user._id);
}, [user]);




    const requestJoin = async (groupId) => {
    await API.post(`/groups/${groupId}/request`);
    alert("Request sent");
  };
  
  return (
    <div className="h-screen flex">

      {(!isMobile || !activeGroup) && (
      <Sidebar
        groups={groups}
        setGroups={setGroups}
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
          notifications={notifications}
  setNotifications={setNotifications}
      />
      )}

      {(!isMobile || activeGroup) && activeGroup && (
        <ChatWindow group={activeGroup} groups={groups} setActiveGroup={setActiveGroup} setGroups={setGroups} communityAdmins={communityAdmin} isMobile={isMobile} />
      )}
    </div>
  );
};

export default Community;

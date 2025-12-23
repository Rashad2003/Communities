const Sidebar = ({ groups, activeGroup, setActiveGroup }) => {
  const orderedGroups = [
    ...groups.filter(g => g.isAnnouncement),
    ...groups.filter(g => !g.isAnnouncement)
  ];

  return (
    <div className="w-80 bg-white border-r">
      {/* Header */}
      <div className="bg-primary text-white p-4 text-lg font-semibold">
        LMS Community
      </div>

      {/* Groups */}
      <div className="overflow-y-auto h-full">
        {orderedGroups.map(group => (
          <div
            key={group._id}
            onClick={() => setActiveGroup(group)}
            className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
              activeGroup?._id === group._id
                ? "bg-gray-200"
                : ""
            }`}
          >
            <div className="font-semibold">
              {group.isAnnouncement ? "📢 " : "💬 "}
              {group.name}
            </div>
            <div className="text-sm text-gray-500">
              Tap to open chat
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

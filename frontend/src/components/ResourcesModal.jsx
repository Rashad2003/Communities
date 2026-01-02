import { useState, useEffect } from "react";
import API from "../api/api";
import { IoMdClose, IoMdDownload } from "react-icons/io";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaImage } from "react-icons/fa";

const ResourcesModal = ({ groupId, onClose }) => {
    const [activeTab, setActiveTab] = useState("media"); // "media" | "docs"
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await API.get(`/messages/resources/${groupId}`);
                setResources(res.data);
            } catch (err) {
                console.error("Failed to fetch resources", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, [groupId]);

    const images = resources.filter(r => r.type === "image");
    const files = resources.filter(r => r.type === "file");

    const getFileIcon = (filename) => {
        if (filename.endsWith(".pdf")) return <FaFilePdf className="text-red-500" />;
        if (filename.endsWith(".doc") || filename.endsWith(".docx")) return <FaFileWord className="text-blue-500" />;
        if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) return <FaFileExcel className="text-green-500" />;
        return <FaFileAlt className="text-gray-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[80vh]">
                {/* HEADER */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-black">
                        📚 Class Resources
                    </h2>
                    <button onClick={onClose} className="p-1 text-black rounded-full">
                        <IoMdClose size={24} />
                    </button>
                </div>

                {/* TABS */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("media")}
                        className={`flex-1 p-3 font-semibold text-center ${activeTab === "media"
                            ? "text-primary border-b-2 border-primary"
                            : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        🖼️ Media ({images.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("docs")}
                        className={`flex-1 p-3 font-semibold text-center ${activeTab === "docs"
                            ? "text-primary border-b-2 border-primary"
                            : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        📄 Documents ({files.length})
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center p-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === "media" && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.length === 0 ? (
                                        <p className="col-span-full text-center text-gray-500 py-10">No images shared yet.</p>
                                    ) : (
                                        images.map(img => (
                                            <div key={img._id} className="relative group aspect-square bg-gray-200 rounded-lg overflow-hidden border">
                                                <img
                                                    src={`http://localhost:5000${img.content}`}
                                                    alt="Resource"
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                                    onClick={() => window.open(`http://localhost:5000${img.content}`, "_blank")}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Sent by {img.sender?.name || "Unknown"}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "docs" && (
                                <div className="space-y-2">
                                    {files.length === 0 ? (
                                        <p className="text-center text-gray-500 py-10">No documents shared yet.</p>
                                    ) : (
                                        files.map(file => (
                                            <div key={file._id} className="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="text-2xl flex-shrink-0">
                                                        {getFileIcon(file.content)}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-medium truncate text-sm" title={file.content.split('/').pop()}>
                                                            {file.content.split('/').pop()} // naive filename
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(file.createdAt).toLocaleDateString()} • {file.sender?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`http://localhost:5000${file.content}`}
                                                    download
                                                    target="_blank"
                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Download"
                                                >
                                                    <IoMdDownload size={20} />
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourcesModal;

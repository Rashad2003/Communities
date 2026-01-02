import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import API from "../api/api";

const CreateEventModal = ({ onClose, groupId }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !date || !time) return alert("Please fill required fields");

        const eventDateTime = new Date(`${date}T${time}`);

        const eventData = {
            title,
            description,
            date: eventDateTime.toISOString(),
            location,
            attendees: []
        };

        try {
            const formData = new FormData();
            formData.append("groupId", groupId);
            formData.append("type", "event");
            formData.append("eventData", JSON.stringify(eventData));

            await API.post("/messages", formData);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create event");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Event</h2>
                    <button onClick={onClose}><IoMdClose className="text-2xl" /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Event Title *</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Meeting"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Description</label>
                        <textarea
                            className="w-full border rounded p-2"
                            rows="3"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                className="w-full border rounded p-2"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Time *</label>
                            <input
                                type="time"
                                required
                                className="w-full border rounded p-2"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Location / Link</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g. Conference Room A"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-opacity-90"
                    >
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;

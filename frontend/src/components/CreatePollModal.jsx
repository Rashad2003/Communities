import { useState } from "react";
import { IoMdClose, IoMdAdd } from "react-icons/io";
import { FaTrash } from "react-icons/fa";
import API from "../api/api";
import { getUser } from "../utils/auth";

const CreatePollModal = ({ onClose, groupId }) => {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const user = getUser();

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, ""]);
    };

    const removeOption = (index) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return alert("Question is required");
        if (options.some(opt => !opt.trim())) return alert("All options must be filled");

        const pollData = {
            question,
            options: options.map(text => ({ text, votes: [] })),
            allowMultiple
        };

        try {
            const formData = new FormData();
            formData.append("groupId", groupId);
            formData.append("type", "poll");
            formData.append("pollData", JSON.stringify(pollData));

            // Dummy content required by some backend checks? 
            // Based on controller logic, finalContent is set to "📊 Poll" if type is poll.

            await API.post("/messages", formData);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create poll");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create Poll</h2>
                    <button onClick={onClose}><IoMdClose className="text-2xl" /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Question</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder="Ask a question..."
                        />
                    </div>

                    <div className="mb-4 max-h-60 overflow-y-auto">
                        <label className="block text-sm font-medium mb-1">Options</label>
                        {options.map((opt, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="flex-1 border rounded p-2"
                                    value={opt}
                                    onChange={e => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(index)} className="text-red-500">
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-2 text-blue-500 flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                            <IoMdAdd /> Add Option
                        </button>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="allowMultiple"
                            checked={allowMultiple}
                            onChange={e => setAllowMultiple(e.target.checked)}
                        />
                        <label htmlFor="allowMultiple" className="text-sm">Allow multiple answers</label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-opacity-90"
                    >
                        Create Poll
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePollModal;

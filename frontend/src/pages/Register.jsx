import { useState } from "react";
import API from "../api/api";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
  });

  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await API.post("/auth/register", form);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    navigate("/community");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-primary text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        <input
          name="name"
          placeholder="Full Name"
          className="w-full mb-4 p-2 border rounded-md"
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded-md"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded-md"
          onChange={handleChange}
        />

        <select
          name="role"
          className="w-full mb-6 p-2 border rounded-md"
          onChange={handleChange}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>

        <button className="w-full bg-secondary text-white py-2 rounded-md hover:opacity-90 border">
          Register
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-secondary font-semibold">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

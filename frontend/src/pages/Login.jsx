import { useState } from "react";
import API from "../api/api";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await API.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    navigate("/community");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-80"
      >
        <h2 className="text-primary text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        <input
          className="w-full mb-4 p-2 border rounded-md"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-6 p-2 border rounded-md"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button className="w-full bg-secondary text-white py-2 rounded-md hover:opacity-90">
          Login
        </button>
        <p className="text-center text-sm mt-4">
  Don’t have an account?{" "}
  <Link to="/register" className="text-secondary font-semibold">
    Register
  </Link>
</p>
      </form>
    </div>
  );
};

export default Login;

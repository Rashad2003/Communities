import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!token) return null;

  return (
    <nav className="bg-primary px-6 py-4 flex justify-between items-center">
      <h1 className="text-white text-xl font-semibold">
        LMS Community
      </h1>
      <div className="space-x-6">
        <Link className="text-white hover:text-secondary" to="/community">
          Community
        </Link>
        <button onClick={logout} className="text-white hover:text-secondary">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

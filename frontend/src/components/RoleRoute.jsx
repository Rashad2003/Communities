import { Navigate } from "react-router-dom";
import { isAdminOrInstructor } from "../utils/auth";

const RoleRoute = ({ children }) => {
  return isAdminOrInstructor()
    ? children
    : <Navigate to="/community" replace />;
};

export default RoleRoute;

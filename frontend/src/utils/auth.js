export const getUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };
  
  export const isAdminOrInstructor = () => {
    const user = getUser();
    return user?.role === "admin" || user?.role === "instructor";
  };
  
export const getUser = () => {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") return null;

    return JSON.parse(user);
  };
  
  export const isAdminOrInstructor = () => {
    const user = getUser();
    return user?.role === "admin" || user?.role === "instructor";
  };
  
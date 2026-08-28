import { Routes, Route, Navigate } from "react-router";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import ProblemDetailPage from "./pages/ProblemPage";
import AdminPanel from "./pages/AdminPanel";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import MainTabs from "./components/MainTabs";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./authSlice";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<MainTabs />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/signUp" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
      <Route path="/problem/:problemId" element={<ProblemDetailPage/>}/>
      <Route
        path="/admin"
        element={isAuthenticated && user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile/edit"
        element={isAuthenticated ? <EditProfilePage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
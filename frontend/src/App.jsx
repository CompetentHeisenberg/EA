import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Main from "./pages/Main";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import ProfilePage from "./pages/ProfilePage";
import HistoryDetailPage from "./pages/HistoryDetailPage";
import HistoryPage from "./pages/HistoryPage";
import MarketsPage from "./pages/MarketsPage";
import Workspace from "./pages/Workspace";

const PrivateRoute = ({ children }) => {
  return localStorage.getItem("token") ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Main />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <PrivateRoute>
              <HistoryDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/markets"
          element={
            <PrivateRoute>
              <MarketsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/workspace"
          element={
            <PrivateRoute>
              <Workspace />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

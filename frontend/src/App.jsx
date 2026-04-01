import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Main from "./pages/Main";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import CorrelationPage from "./pages/CorrelationPage";
import PCAPage from "./pages/PCAPage";

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
          path="/correlation"
          element={
            <PrivateRoute>
              <CorrelationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pca"
          element={
            <PrivateRoute>
              <PCAPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

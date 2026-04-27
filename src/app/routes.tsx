import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EventDetailRealtimeScreen } from "./components/EventDetailRealtimeScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
  },
  {
    path: "/register",
    Component: RegisterScreen,
  },
  {
    path: "/home",
    Component: () => (
      <ProtectedRoute>
        <HomeScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/event/:id",
    Component: () => (
        <ProtectedRoute>
        <EventDetailRealtimeScreen />
      </ProtectedRoute>
    ),
  },
]);

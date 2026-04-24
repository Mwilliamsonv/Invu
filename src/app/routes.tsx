import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen, EVENTS_DATA } from "./components/HomeScreen";
import { EventDetailScreen } from "./components/EventDetailScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
  },
  {
    path: "/home",
    Component: HomeScreen,
  },
  {
    path: "/event/:id",
    Component: () => <EventDetailScreen events={EVENTS_DATA} />,
  },
]);

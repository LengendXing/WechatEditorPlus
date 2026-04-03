import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <div className="p-8 text-fg-secondary">Select or create an article</div> },
      { path: "editor/:id", element: <div>Editor placeholder</div> },
      { path: "settings", element: <div>Settings placeholder</div> },
    ],
  },
]);

export default router;

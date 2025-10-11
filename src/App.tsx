import "@/App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes/router";
import { AppProviders } from "@/app/providers";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

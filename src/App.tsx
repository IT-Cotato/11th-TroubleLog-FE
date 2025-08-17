import "@/App.css";
import AlertSSEProvider from "@/providers/AlertSSEProvider";
import { router } from "@/routes/Router";
import { RouterProvider } from "react-router-dom";

function App() {
  return (
    <AlertSSEProvider>
      <RouterProvider router={router} />
    </AlertSSEProvider>
  );
}

export default App;

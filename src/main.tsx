import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Suppress AbortError from Supabase client in strict mode
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
        reason?.name === 'AbortError' ||
        reason?.message?.includes('AbortError') ||
        reason === 'AbortError'
    ) {
        event.preventDefault();
    }
});

import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

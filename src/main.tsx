import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Suppress AbortError from Supabase client in strict mode
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
        (reason && reason.name === 'AbortError') ||
        (reason && reason.message && typeof reason.message === 'string' && reason.message.includes('AbortError')) ||
        reason === 'AbortError'
    ) {
        event.preventDefault();
    }
});

import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

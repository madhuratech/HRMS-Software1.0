import { createRoot } from "react-dom/client";
import App from './App';
import "./index.css";
import { API_URL } from './lib/api';

// Intercept relative API paths (/app/*, /api/*, /uploads/*) to route to the configured backend URL
if (typeof window !== 'undefined' && API_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      if (input.startsWith('/app/') || input.startsWith('/api/') || input.startsWith('/uploads/')) {
        input = `${API_URL}${input}`;
      }
    } else if (input instanceof Request) {
      const url = new URL(input.url, window.location.origin);
      if (url.pathname.startsWith('/app/') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
        input = new Request(`${API_URL}${url.pathname}${url.search}`, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

createRoot(document.getElementById("root")).render(<App />);
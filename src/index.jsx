import "./init"
import React from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

console.log('🎬 index.jsx loading...');
console.log('🌍 Environment:', { 
  hostname: window.location.hostname, 
  pathname: window.location.pathname,
  ancestorOrigins: window.location.ancestorOrigins?.length 
});

// Error boundary to catch any React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('❌ ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: '#c00', fontFamily: 'monospace' }}>
          <h1>Error Loading App</h1>
          <pre>{this.state.error?.toString()}</pre>
          <p>Check the console for more details</p>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  console.log('🎯 Getting root element...');
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('❌ Root element not found!');
    throw new Error('Root element #root not found in DOM');
  }
  console.log('✅ Root element found');
  
  console.log('🏗️ Creating React root...');
  const root = createRoot(rootElement);
  console.log('✅ React root created');
  
  console.log('🎨 Rendering App...');
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('✅ App rendered');
} catch (err) {
  console.error('❌ Fatal error in index.jsx:', err);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #c00; font-family: monospace;">
      <h1>Fatal Error</h1>
      <pre>${err.toString()}</pre>
      <p>Check the console for more details</p>
    </div>
  `;
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

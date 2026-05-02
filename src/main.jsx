import React from 'react';
import * as ReactDOM from 'react-dom/client';
import './styles.css';

// The bundle's JSX uses React.useState, ReactDOM.createPortal, etc., as if
// they were globals (because in the standalone bundle they are). Expose them
// on window before importing App so the JSX inside app.jsx finds them.
window.React = React;
window.ReactDOM = ReactDOM;
window.useState = React.useState;
window.useEffect = React.useEffect;
window.useRef = React.useRef;
window.useMemo = React.useMemo;
window.useCallback = React.useCallback;
window.useReducer = React.useReducer;
window.useContext = React.useContext;
window.useLayoutEffect = React.useLayoutEffect;

// Stub the user-bootstrap that production injects via the unpacker.
// In local dev there's no /api/portal/auth/me, so we hardcode a placeholder
// the same way design Claude's preview does. Edit these to test other names.
window.PORTAL_CURRENT_USER = window.PORTAL_CURRENT_USER || 'Mergim Kelmendi';
window.PORTAL_CURRENT_EMAIL = window.PORTAL_CURRENT_EMAIL || 'mergim@slice.com';

import App from './app.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

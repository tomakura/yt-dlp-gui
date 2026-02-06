"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
require("./index.css");
var App_tsx_1 = require("./App.tsx");
var i18n_1 = require("./i18n");
(0, client_1.createRoot)(document.getElementById('root')).render(<react_1.StrictMode>
    <i18n_1.I18nProvider>
      <App_tsx_1.default />
    </i18n_1.I18nProvider>
  </react_1.StrictMode>);

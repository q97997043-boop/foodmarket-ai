import{h as i,x,E as p,l as e,f as l}from"./index-B8k9eVpy.js";/**
 * @license lucide-react v0.350.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=i("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]);/**
 * @license lucide-react v0.350.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);function h({className:t,showLatency:o=!0}){const{t:s}=x(),{isConnected:c,isConnecting:r,latencyMs:n,reconnectAttempt:a}=p();if(r&&a>0)return e.jsxs("div",{className:l("flex items-center gap-1.5 text-xs text-amber-400",t),children:[e.jsxs("span",{className:"relative flex h-2 w-2",children:[e.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"}),e.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-amber-400"})]}),s("connection.reconnecting",{attempt:a})]});if(!c)return e.jsxs("div",{className:l("flex items-center gap-1.5 text-xs text-red-400",t),children:[e.jsx("span",{className:"inline-flex h-2 w-2 rounded-full bg-red-400"}),s("connection.disconnected")]});const d=n===null?"text-muted-foreground":n<80?"text-emerald-400":n<250?"text-yellow-400":"text-red-400";return e.jsxs("div",{className:l("flex items-center gap-1.5 text-xs",d,t),children:[e.jsxs("span",{className:"relative flex h-2 w-2",children:[e.jsx("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"}),e.jsx("span",{className:"relative inline-flex rounded-full h-2 w-2 bg-emerald-400"})]}),e.jsx("span",{children:s("connection.live")}),o&&n!==null&&e.jsxs("span",{className:"opacity-70 font-mono",children:[n,"ms"]})]})}export{h as C,m as S,f as T};

function s(t){if(t)return t.startsWith("data:")||t.startsWith("http://")||t.startsWith("https://")||t.startsWith("/")?t:`/${t.replace(/^\/+/,"")}`}export{s as r};

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createClient: () => createClient
});
module.exports = __toCommonJS(index_exports);

// src/core/HttpClient.ts
function normalizeUrl(base, path) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}
var HttpClient = class {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  async request(url, config) {
    const fullUrl = normalizeUrl(this.baseUrl, url);
    const defaultHeaders = { "Content-Type": "application/json" };
    const headers = __spreadValues(__spreadValues({}, defaultHeaders), config.headers || {});
    const response = await fetch(fullUrl, {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : void 0
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    return response.json();
  }
  get(url, headers) {
    return this.request(url, { method: "GET", headers });
  }
  post(url, body, headers) {
    return this.request(url, { method: "POST", body, headers });
  }
  put(url, body, headers) {
    return this.request(url, { method: "PUT", body, headers });
  }
  delete(url, headers) {
    return this.request(url, { method: "DELETE", headers });
  }
  patch(url, body, headers) {
    return this.request(url, { method: "PATCH", body, headers });
  }
};

// src/utils/createClient.ts
var createClient = (baseUrl) => {
  return new HttpClient(baseUrl);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createClient
});

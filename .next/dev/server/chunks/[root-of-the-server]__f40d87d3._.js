module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/payrails.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPayrailsEnv",
    ()=>getPayrailsEnv,
    "getPayrailsToken",
    ()=>getPayrailsToken,
    "isPayrailsConfigured",
    ()=>isPayrailsConfigured,
    "payrailsFetch",
    ()=>payrailsFetch
]);
// Payrails SDK — handles OAuth 2.0 access token retrieval + caching.
// API reference: https://docs.payrails.com
//
// The access token is valid for a limited duration (expires_in, default 3600s).
// We cache it in-memory and refresh automatically when it expires.
//
// Required env vars:
//   PAYRAILS_API_KEY    — secret API key (sent in x-api-key header)
//   PAYRAILS_CLIENT_ID  — client ID (path parameter for /auth/token/{clientId})
//   PAYRAILS_ENV        — "staging" (default) or "production"
const PAYRAILS_BASE_URL = process.env.PAYRAILS_ENV === 'production' ? 'https://api.payrails.io' : 'https://api.staging.payrails.io';
// In-memory token cache (survives within the server process)
let cachedToken = null;
/**
 * Get the Payrails API key + client ID from environment.
 * Throws a clear error if not configured.
 */ function getCredentials() {
    const apiKey = process.env.PAYRAILS_API_KEY;
    const clientId = process.env.PAYRAILS_CLIENT_ID;
    if (!apiKey || !clientId) {
        throw new Error('Payrails not configured. Set PAYRAILS_API_KEY and PAYRAILS_CLIENT_ID in .env');
    }
    return {
        apiKey,
        clientId
    };
}
/**
 * Check if the cached token is still valid (with a 60s safety margin).
 */ function isTokenValid(token) {
    if (!token) return false;
    return Date.now() < token.expiresAt - 60_000;
}
async function getPayrailsToken() {
    // Return cached token if still valid
    if (isTokenValid(cachedToken)) {
        return cachedToken.access_token;
    }
    const { apiKey, clientId } = getCredentials();
    const res = await fetch(`${PAYRAILS_BASE_URL}/auth/token/${clientId}`, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json'
        }
    });
    if (!res.ok) {
        const errorBody = await res.text().catch(()=>'');
        throw new Error(`Payrails token request failed: HTTP ${res.status} — ${errorBody.slice(0, 300)}`);
    }
    const data = await res.json();
    cachedToken = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expiresAt: Date.now() + data.expires_in * 1000
    };
    return cachedToken.access_token;
}
async function payrailsFetch(path, options = {}) {
    const token = await getPayrailsToken();
    const url = path.startsWith('http') ? path : `${PAYRAILS_BASE_URL}${path}`;
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers || {}
        }
    });
}
function isPayrailsConfigured() {
    return !!(process.env.PAYRAILS_API_KEY && process.env.PAYRAILS_CLIENT_ID);
}
function getPayrailsEnv() {
    return process.env.PAYRAILS_ENV === 'production' ? 'production' : 'staging';
}
}),
"[project]/src/app/api/payrails/token/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$payrails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/payrails.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$payrails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPayrailsConfigured"])()) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Payrails not configured. Set PAYRAILS_API_KEY and PAYRAILS_CLIENT_ID in .env',
            configured: false
        }, {
            status: 503
        });
    }
    try {
        const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$payrails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayrailsToken"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            access_token: token,
            token_type: 'Bearer',
            environment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$payrails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayrailsEnv"])(),
            configured: true
        });
    } catch (e) {
        const err = e;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: err.message || 'Failed to get Payrails token',
            configured: true
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f40d87d3._.js.map
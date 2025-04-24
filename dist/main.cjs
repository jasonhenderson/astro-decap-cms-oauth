(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory(require("astro/config")) : typeof define === "function" && define.amd ? define(["astro/config"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.AstroDecapCMSOAuth = factory(global.config));
})(this, function(config) {
  "use strict";
  const defaultOptions = {
    decapCMSSrcUrl: "",
    decapCMSVersion: "3.3.3",
    adminDisabled: false,
    adminRoute: "/admin",
    oauthDisabled: false,
    oauthLoginRoute: "/oauth",
    oauthCallbackRoute: "/oauth/callback"
  };
  function decapCMS(options = {}) {
    const {
      decapCMSSrcUrl,
      decapCMSVersion,
      adminDisabled,
      adminRoute,
      oauthDisabled,
      oauthLoginRoute,
      oauthCallbackRoute
    } = {
      ...defaultOptions,
      ...options
    };
    if (!(adminRoute == null ? void 0 : adminRoute.startsWith("/")) || !(oauthLoginRoute == null ? void 0 : oauthLoginRoute.startsWith("/")) || !(oauthCallbackRoute == null ? void 0 : oauthCallbackRoute.startsWith("/"))) {
      throw new Error('`adminRoute`, `oauthLoginRoute` and `oauthCallbackRoute` options must start with "/"');
    }
    return {
      name: "astro-decap-cms-oauth",
      hooks: {
        "astro:config:setup": async ({ injectRoute, updateConfig }) => {
          const env = { validateSecrets: true, schema: {} };
          if (!adminDisabled) {
            env.schema.PUBLIC_DECAP_CMS_SRC_URL = config.envField.string({
              context: "client",
              access: "public",
              optional: true,
              default: decapCMSSrcUrl
            });
            env.schema.PUBLIC_DECAP_CMS_VERSION = config.envField.string({
              context: "client",
              access: "public",
              optional: true,
              default: decapCMSVersion
            });
            injectRoute({
              pattern: adminRoute,
              entrypoint: "astro-decap-cms-oauth/src/admin.astro"
            });
          }
          if (!oauthDisabled) {
            env.schema.OAUTH_GITHUB_CLIENT_ID = config.envField.string({
              context: "server",
              access: "secret"
            });
            env.schema.OAUTH_GITHUB_CLIENT_SECRET = config.envField.string({
              context: "server",
              access: "secret"
            });
            env.schema.OAUTH_GITHUB_REPO_ID = config.envField.string({
              context: "server",
              access: "secret",
              optional: true,
              default: ""
            });
            injectRoute({
              pattern: oauthLoginRoute,
              entrypoint: "astro-decap-cms-oauth/src/oauth/index.ts"
            });
            injectRoute({
              pattern: oauthCallbackRoute,
              entrypoint: "astro-decap-cms-oauth/src/oauth/callback.ts"
            });
          }
          updateConfig({ env });
        }
      }
    };
  }
  return decapCMS;
});

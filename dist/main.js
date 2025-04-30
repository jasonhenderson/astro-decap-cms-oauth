import { envField } from "astro/config";
const defaultOptions = {
  decapCMSSrcUrl: "",
  decapCMSVersion: "3.3.3",
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
  decapCMSEvents: []
};
function decapCMS(options = {}) {
  const {
    decapCMSSrcUrl,
    decapCMSVersion,
    adminDisabled,
    adminRoute,
    oauthDisabled,
    oauthLoginRoute,
    oauthCallbackRoute,
    decapCMSEvents
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
      "astro:config:setup": async ({ injectRoute, injectScript, updateConfig }) => {
        const env = { validateSecrets: true, schema: {} };
        if (decapCMSEvents && decapCMSEvents.length > 0) {
          injectScript(
            "page",
            `
            (function () {

              console.log('registering decapCMS events with CMS: ', ${JSON.stringify(decapCMSEvents)});

              if (typeof window === 'undefined' || typeof window.CMS === 'undefined') {
                console.error('CMS is not defined');
                return;
              }

              window.CMS.registerEventListener({
                name: 'preSave',
                handler: async (event) => {//{ get: (key: string) => { set: (key: string, value: string) => void } } }) => {
                    console.log('preSave event triggered', event);
                    console.log('entry', event.entry);
                    console.log('entry.get', JSON.stringify(event.entry.get('data')));
                    console.log('entry.get.data.title', event.entry.get('data').get('title'));
                    console.log('entry.get.data.path', event.entry.get('data').get('path'));

                    //event.entry.get('data').set('title', 'new title' + Math.random());
                },
              });

              // window.CMS.registerEventListener({
              //   name: 'prePublish',
              //   handler: async (event) => {//{ get: (key: string) => { set: (key: string, value: string) => void } } }) => {
              //       console.log('prePublish event triggered', event);
              //       console.log('entry', event.entry);
              //       console.log('entry.get', event.entry.get('data'));
              //       console.log('entry.get.data.title', event.entry.get('data').get('title'));
              //       console.log('entry.get.data.path', event.entry.get('data').get('path'));

              //       //event.entry.get('data').set('title', 'new title' + Math.random());
              //   },
              // });
            })();
            `
          );
        }
        if (!adminDisabled) {
          env.schema.PUBLIC_DECAP_CMS_SRC_URL = envField.string({
            context: "client",
            access: "public",
            optional: true,
            default: decapCMSSrcUrl
          });
          env.schema.PUBLIC_DECAP_CMS_VERSION = envField.string({
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
          env.schema.OAUTH_GITHUB_CLIENT_ID = envField.string({
            context: "server",
            access: "secret"
          });
          env.schema.OAUTH_GITHUB_CLIENT_SECRET = envField.string({
            context: "server",
            access: "secret"
          });
          env.schema.OAUTH_GITHUB_REPO_ID = envField.string({
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
export {
  decapCMS as default
};

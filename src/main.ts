import type { AstroConfig, AstroIntegration, AstroMiddlewareInstance } from "astro";
import { envField } from "astro/config";

// Define the window object type
declare global {
  interface Window {
    CMS: {
      registerEventListener: any
    }
  }
}

export type DecapCMSEvent = {
  name: string;
  handler: ({ entry }: { entry: any; }) => Promise<void>;
};
export interface DecapCMSOptions {
  decapCMSSrcUrl?: string;
  decapCMSVersion?: string;
  adminDisabled?: boolean;
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
  decapCMSEvents?: DecapCMSEvent[];
}
const defaultOptions: DecapCMSOptions = {
  decapCMSSrcUrl: "",
  decapCMSVersion: "3.3.3",
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
  decapCMSEvents: [],
};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  const {
    decapCMSSrcUrl,
    decapCMSVersion,
    adminDisabled,
    adminRoute,
    oauthDisabled,
    oauthLoginRoute,
    oauthCallbackRoute,
    decapCMSEvents,
  } = {
    ...defaultOptions,
    ...options,
  };

  if (!adminRoute?.startsWith("/") || !oauthLoginRoute?.startsWith("/") || !oauthCallbackRoute?.startsWith("/")) {
    throw new Error('`adminRoute`, `oauthLoginRoute` and `oauthCallbackRoute` options must start with "/"');
  }

  return {
    name: "astro-decap-cms-oauth",
    hooks: {
      "astro:config:setup": async ({ injectRoute, injectScript, updateConfig }) => {
        const env: AstroConfig["env"] = { validateSecrets: true, schema: {} };

        if (decapCMSEvents && decapCMSEvents.length > 0) {

          // AstroConfig.locals.decapCMSEvents = decapCMSEvents;
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
          env.schema!.PUBLIC_DECAP_CMS_SRC_URL = envField.string({
            context: "client",
            access: "public",
            optional: true,
            default: decapCMSSrcUrl,
          });
          env.schema!.PUBLIC_DECAP_CMS_VERSION = envField.string({
            context: "client",
            access: "public",
            optional: true,
            default: decapCMSVersion,
          });
          // mount DecapCMS admin route
          injectRoute({
            pattern: adminRoute,
            entrypoint: "astro-decap-cms-oauth/src/admin.astro",
          });
        }

        if (!oauthDisabled) {
          env.schema!.OAUTH_GITHUB_CLIENT_ID = envField.string({
            context: "server",
            access: "secret",
          });
          env.schema!.OAUTH_GITHUB_CLIENT_SECRET = envField.string({
            context: "server",
            access: "secret",
          });
          env.schema!.OAUTH_GITHUB_REPO_ID = envField.string({
            context: "server",
            access: "secret",
            optional: true,
            default: "",
          });

          // mount OAuth backend - sign in route
          injectRoute({
            pattern: oauthLoginRoute,
            entrypoint: "astro-decap-cms-oauth/src/oauth/index.ts",
          });

          // mount OAuth backend - callback route
          injectRoute({
            pattern: oauthCallbackRoute,
            entrypoint: "astro-decap-cms-oauth/src/oauth/callback.ts",
          });
        }

        // apply env schema & defaults
        updateConfig({ env });
      },
    },
  };
}

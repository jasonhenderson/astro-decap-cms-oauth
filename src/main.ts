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
                handler: async ({ entry }: { entry: any }) => {//{ get: (key: string) => { set: (key: string, value: string) => void } } }) => {
                    console.log('preSave event triggered');
                    console.log('entry', entry);
                    console.log('entry.get', entry.get('data'));
                    console.log('entry.get.data', entry.get('data').get('title'));

                    //entry.get('data').set('title', 'new title' + Math.random());
                },
              });

              window.CMS.registerEventListener({
                name: 'prePublish',
                handler: async ({ entry }: { entry: any }) => {//{ get: (key: string) => { set: (key: string, value: string) => void } } }) => {
                    console.log('prePublish event triggered');
                    console.log('entry', entry);
                    console.log('entry.get', entry.get('data'));
                    console.log('entry.get.data', entry.get('data').get('title'));

                    //entry.get('data').set('title', 'new title' + Math.random());
                },
              });
            
              // window.CMS = window.CMS || {};
              // window.CMS.registerEventListener = function (eventName, handler) {
              //   if (!window.CMS.events) {
              //     window.CMS.events = {};
              //   }
              //   if (!window.CMS.events[eventName]) {
              //     window.CMS.events[eventName] = [];
              //   }
              //   window.CMS.events[eventName].push(handler);
              // }
              // window.CMS.events = window.CMS.events || {};
              // window.CMS.events.registered = ${JSON.stringify(decapCMSEvents)};
              // window.CMS.events.registered.forEach(function (event) {
              //   if (window.CMS.events[event.name]) {
              //     window.CMS.events[event.name].forEach(function (handler) {
              //       handler();
              //     });
              //   }
              // };
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

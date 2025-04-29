import { AstroIntegration } from 'astro';

declare function decapCMS(options?: DecapCMSOptions): AstroIntegration;
export default decapCMS;

declare type DecapCMSEvent = {
    name: string;
    handler: ({ entry }: {
        entry: any;
    }) => Promise<void>;
};

declare interface DecapCMSOptions {
    decapCMSSrcUrl?: string;
    decapCMSVersion?: string;
    adminDisabled?: boolean;
    adminRoute?: string;
    oauthDisabled?: boolean;
    oauthLoginRoute?: string;
    oauthCallbackRoute?: string;
    decapCMSEvents?: DecapCMSEvent[];
}

export { }


declare global {
    interface Window {
        CMS: {
            registerEventListener: any;
        };
    }
}

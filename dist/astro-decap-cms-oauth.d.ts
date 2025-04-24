import { AstroIntegration } from 'astro';

declare function decapCMS(options?: DecapCMSOptions): AstroIntegration;
export default decapCMS;

declare interface DecapCMSOptions {
    decapCMSSrcUrl?: string;
    decapCMSVersion?: string;
    adminDisabled?: boolean;
    adminRoute?: string;
    oauthDisabled?: boolean;
    oauthLoginRoute?: string;
    oauthCallbackRoute?: string;
}

export { }


declare global {
    interface Window {
        CMS: any;
    }
}

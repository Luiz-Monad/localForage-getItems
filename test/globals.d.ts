/* eslint-disable @typescript-eslint/ban-types */
import { LocalForageComplete } from '@luiz-monad/localforage/dist/types';

declare global {
    type LocalForageDriver = LocalForageComplete;
    declare const localforage: LocalForageComplete;

    declare const Modernizr: any;
    declare const requirejs: any;

    interface Window {
        localforage: LocalForageDriver;

        mochaResults: any;
        requireTest: boolean | undefined;
        callWhenReadyTest: boolean | undefined;
    }

    interface Console {
        infoLogs: { args: any[] }[];
    }
}

// polyfill types
declare global {
    // eslint-disable-next-line no-var
    declare var require: Function | undefined; //must be var because of scope exporting.

    interface Window {
        indexedDB: IDBFactory | undefined;
        webkitIndexedDB: IDBFactory | undefined;
        mozIndexedDB: IDBFactory | undefined;
        OIndexedDB: IDBFactory | undefined;
        msIndexedDB: IDBFactory | undefined;

        attachEvent: Function;
    }

    namespace Chai {
        interface Assertion {
            (type: any, message?: string): Assertion;
        }
    }

    namespace Mocha {
        interface HookFunction {
            skip: PendingTestFunction;
        }
    }
}

export {};

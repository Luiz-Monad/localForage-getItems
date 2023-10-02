import { Database } from 'websql';

declare global {
    // declare let IDBKeyRange: typeof IDBKeyRange | undefined;
    declare let webkitIDBKeyRange: typeof IDBKeyRange | undefined;
    declare let mozIDBKeyRange: typeof IDBKeyRange | undefined;
    declare let OIDBKeyRange: typeof IDBKeyRange | undefined;
    declare let msIDBKeyRange: typeof IDBKeyRange | undefined;

    interface Window {}
}

declare global {
    interface LocalForageComplete {
        getItems: MethodsCoreWithGetItems['getItems'];
    }
}

export {};

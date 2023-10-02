/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-var */
/* eslint-disable prefer-const */
import { ItemsResult, extendPrototype } from 'localforage-getitems';
import localforage from '@luiz-monad/localforage';

type LocalForageGetItemsResult = ItemsResult<any>;

namespace LocalForageGetItemsTest {
    {
        let localforage2: LocalForageComplete = extendPrototype(localforage);
    }

    {
        let itemsPromise: Promise<object> = localforage.getItems();

        itemsPromise.then((promiseResults) => {
            let results: LocalForageGetItemsResult = promiseResults;
            Object.keys(results).forEach((key) => {
                let itemKey: string = key;
                let itemValue: any = results[key];
                console.log(itemKey, itemValue);
            });
        });
    }

    {
        let itemsPromise: Promise<object> = localforage.getItems(null);

        itemsPromise.then((promiseResults) => {
            let results: LocalForageGetItemsResult = promiseResults;
            Object.keys(results).forEach((key) => {
                let itemKey: string = key;
                let itemValue: any = results[key];
                console.log(itemKey, itemValue);
            });
        });
    }

    {
        let itemsPromise: Promise<object> = localforage.getItems(['a', 'b', 'c']);

        itemsPromise.then((promiseResults) => {
            let results: LocalForageGetItemsResult = promiseResults;
            Object.keys(results).forEach((key) => {
                let itemKey: string = key;
                let itemValue: any = results[key];
                console.log(itemKey, itemValue);
            });
        });
    }
}

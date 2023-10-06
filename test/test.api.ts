import chai, { expect } from 'chai';
import sinon, { SinonStubbedMember } from 'sinon';
import sinonChai from 'sinon-chai';
import localforageGetitems, { extendPrototype } from 'localforage-getitems';
import { LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { promisify, promisifyOne, promisifyTwo } from './promisify';
import testHelperPlugin from './test.helper';

chai.use(sinonChai);
chai.use(testHelperPlugin);

mocha.setup({ asyncOnly: true });

const DRIVERS = [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE];

type DriverPromise = typeof localforageGetitems.getItemsGeneric;
const driversImplPromises: Record<string, SinonStubbedMember<DriverPromise> | null> = {};
driversImplPromises[localforage.INDEXEDDB] = null;
driversImplPromises[localforage.WEBSQL] = null;
driversImplPromises[localforage.LOCALSTORAGE] = null;

const SUPPORTED_DRIVERS = DRIVERS.filter(function (driverName) {
    return localforage.supports(driverName);
});

const driverApiMethods = ['getItems'];

const indexedDB =
    // eslint-disable-next-line no-use-before-define
    globalThis.indexedDB ||
    window.indexedDB ||
    window.webkitIndexedDB ||
    window.mozIndexedDB ||
    window.OIndexedDB ||
    window.msIndexedDB;

function patchGetItemsDeps() {
    // eslint-disable-next-line @typescript-eslint/ban-types
    function stubber(fn: DriverPromise & Function) {
        //warning, this uses internal knowledge about how system under test is implemented.
        //         we know that the functions is always called with apply.
        const stub = sinon.stub(fn, 'apply') as SinonStubbedMember<DriverPromise>;
        stub.callThrough();
        return stub;
    }
    const ext = localforageGetitems;
    const impl = driversImplPromises;
    impl[localforage.INDEXEDDB] = stubber(ext.getItemsIndexedDB as any);
    impl[localforage.WEBSQL] = stubber(ext.getItemsWebsql as any);
    impl[localforage.LOCALSTORAGE] = stubber(ext.getItemsGeneric);
}

function resetGetItemsDeps() {
    driversImplPromises[localforage.INDEXEDDB]?.resetHistory();
    driversImplPromises[localforage.WEBSQL]?.resetHistory();
    driversImplPromises[localforage.LOCALSTORAGE]?.resetHistory();
}

function unpatchGetItemsDeps() {
    driversImplPromises[localforage.INDEXEDDB]?.restore();
    driversImplPromises[localforage.WEBSQL]?.restore();
    driversImplPromises[localforage.LOCALSTORAGE]?.restore();
}

function expectSpecificDriverCalled(driver: string, instance?: LocalForageComplete) {
    Object.entries(driversImplPromises).forEach(([k, v]) => {
        if (k !== driver) {
            expect(v!).to.not.be.called;
        } else if (instance) {
            expect(v!).to.be.calledOnceOn(instance);
        } else {
            expect(v!).to.be.calledOnce;
        }
    });
}

describe('localForage', function () {
    this.timeout(30000);

    before(patchGetItemsDeps);
    beforeEach(resetGetItemsDeps);
    after(unpatchGetItemsDeps);

    it('errors when a requested driver is not found [callback]', function () {
        const defaultDriver = localforage.driver()!;
        const setDriver = promisifyTwo(localforage.setDriver, localforage);
        return setDriver('UnknownDriver').then(null, function (error) {
            expect(error).to.be.instanceof(Error);
            expect(error.message).to.be.eq('No available storage method found.');
            const ready = promisifyOne(localforage.ready, localforage);
            return ready().then(function () {
                const getItems = promisify(localforage.getItems, localforage);
                return getItems([]).then(null, function (error) {
                    expect(error).to.be.instanceof(Error);
                    expect(error.message).to.be.eq('No available storage method found.');
                    expectSpecificDriverCalled(defaultDriver);
                });
            });
        });
    });

    it('errors when a requested driver is not found [promise]', function () {
        const defaultDriver = localforage.driver()!;
        return localforage
            .setDriver('UnknownDriver')
            .then(null, function (error) {
                expect(error).to.be.instanceof(Error);
                expect(error.message).to.be.eq('No available storage method found.');
            })
            .then(function () {
                return localforage.ready();
            })
            .then(null, function () {
                return localforage.getItems([]);
            })
            .then(null, function (error) {
                expect(error).to.be.instanceof(Error);
                expect(error.message).to.be.eq('No available storage method found.');
                expectSpecificDriverCalled(defaultDriver);
            });
    });

    describe('createInstance()', function () {
        it('works', function () {
            const localforage2 = extendPrototype(localforage).createInstance();
            const localforage3 = extendPrototype(localforage).createInstance();

            return localforage
                .setDriver(localforage.driver()!)
                .then(function () {
                    return Promise.all([
                        localforage.ready(),
                        localforage2.ready(),
                        localforage3.ready()
                    ]);
                })
                .then(function () {
                    return Promise.all([
                        localforage.getItems(['']),
                        localforage2.getItems(['']),
                        localforage3.getItems([''])
                    ]);
                })
                .then(function () {
                    expectSpecificDriverCalled(localforage.driver()!, localforage);
                    expectSpecificDriverCalled(localforage2.driver()!, localforage2);
                    expectSpecificDriverCalled(localforage3.driver()!, localforage3);
                });
        });
    });
});

SUPPORTED_DRIVERS.forEach(function (driverName) {
    describe(driverName + ' driver', function () {
        this.timeout(30000);

        before(function () {
            return localforage.setDriver(driverName);
        });

        beforeEach(function () {
            localStorage.clear();
            return localforage.ready().then(function () {
                return new Promise((resolve) => localforage.clear(resolve));
            });
        });

        it('has the getItem localStorage API extension', async function () {
            expect(localforage.getItems).to.be.a('function');
        });

        if (driverName === localforage.INDEXEDDB) {
            const localforageIDB =
                localforage as any as import('@luiz-monad/localforage/dist/drivers/indexeddb.d.ts').Module;

            describe('Blob support', function () {
                const blob = new Blob([''], { type: 'image/png' });

                it('check for Blob', function () {
                    return localforage.setItem('key', blob).then(function () {
                        return localforage.getItems(['key']).then(function (values) {
                            expect(values['key']).to.be.instanceOf(Blob);
                        });
                    });
                });
            });

            describe('recover (reconnect) from IDBDatabase InvalidStateError', function () {
                beforeEach(function () {
                    return Promise.all([
                        localforage.setItem('key', 'value1'),
                        localforage.setItem('key1', 'value1'),
                        localforage.setItem('key2', 'value2'),
                        localforage.setItem('key3', 'value3')
                    ]).then(function () {
                        localforageIDB._dbInfo.db!.close();
                    });
                });

                xit('retrieves an item from the storage', function () {
                    return localforage
                        .getItems(['key', 'key1', 'key2', 'key3'])
                        .then(function (values) {
                            expect(values).to.be.deep.eq({
                                key: 'value1',
                                key1: 'value1',
                                key2: 'value2',
                                key3: 'value3'
                            });
                        });
                });
            });
        }

        it('returns all items [callback]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                const getItems = promisify(localforage.getItems, localforage);
                return getItems(null).then(function (values) {
                    expect(values).to.be.deep.eq({
                        key: 'value1',
                        key1: 'value1',
                        key2: 'value2',
                        key3: 'value3'
                    });
                });
            });
        });
        it('returns all items [promise]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                return localforage.getItems().then(function (values) {
                    expect(values).to.be.deep.eq({
                        key: 'value1',
                        key1: 'value1',
                        key2: 'value2',
                        key3: 'value3'
                    });
                });
            });
        });
        it('returns multiple items [callback]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                const getItems = promisify(localforage.getItems, localforage);
                return getItems(['key', 'key1', 'key2', 'key3']).then(function (values) {
                    expect(values).to.be.deep.eq({
                        key: 'value1',
                        key1: 'value1',
                        key2: 'value2',
                        key3: 'value3'
                    });
                });
            });
        });
        it('returns multiple items [promise]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                return localforage
                    .getItems(['key', 'key1', 'key2', 'key3'])
                    .then(function (values) {
                        expect(values).to.be.deep.eq({
                            key: 'value1',
                            key1: 'value1',
                            key2: 'value2',
                            key3: 'value3'
                        });
                    });
            });
        });

        it('nested getItems inside clear works [callback]', function () {
            const setItem = promisify(localforage.setItem, localforage);
            return setItem('hello', 'Hello World !').then(function () {
                const clear = promisify(localforage.clear, localforage);
                return clear().then(function () {
                    const getItems = promisify(localforage.getItems, localforage);
                    return getItems(['hello']).then(function (secondValue) {
                        expect(secondValue).to.be.deep.eq({});
                    });
                });
            });
        });
        it('nested getItems inside clear works [promise]', function () {
            return localforage
                .setItem('hello', 'Hello World !')
                .then(function () {
                    return localforage.clear();
                })
                .then(function () {
                    return localforage.getItems(['hello']);
                })
                .then(function (secondValue) {
                    expect(secondValue).to.be.deep.eq({});
                });
        });

        it('returns empty object for undefined key [callback]', function () {
            const getItems = promisify(localforage.getItems, localforage);
            return getItems(['key']).then(function (value) {
                expect(value).to.be.deep.eq({});
            });
        });

        it('returns empty object for undefined key [promise]', function () {
            return localforage.getItems(['key']).then(function (value) {
                expect(value).to.be.deep.eq({});
            });
        });

        it('returns empty object for a non-existant key [callback]', function () {
            const getItems = promisify(localforage.getItems, localforage);
            return getItems(['undef']).then(function (value) {
                expect(value).to.be.deep.eq({});
            });
        });
        it('returns empty object for a non-existant key [promise]', function () {
            return localforage.getItems(['undef']).then(function (value) {
                expect(value).to.be.deep.eq({});
            });
        });

        // Deal with non-string keys, see issue #250
        // https://github.com/mozilla/localForage/issues/250
        it('casts an undefined key to a String', function () {
            return localforage
                .setItem(undefined!, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems([undefined!]);
                })
                .then(null, function (error) {
                    expect(error).to.be.instanceof(Error);
                    expect(error.name).to.be.eq('DataError');

                    return localforage.getItems();
                })
                .then(function (value) {
                    expect(value).to.be.deep.eq({ undefined: 'goodness!' });

                    return localforage.removeItem(undefined!);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        it('casts a null key to a String', function () {
            return localforage
                .setItem(null!, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems([null!]);
                })
                .then(
                    function (value) {
                        return value;
                    },
                    function (error) {
                        expect(error).to.be.instanceof(Error);
                        expect(error.name).to.be.eq('DataError');
                    }
                )
                .then(function () {
                    return localforage.getItems();
                })
                .then(function (value) {
                    expect(value).to.be.deep.eq({ null: 'goodness!' });

                    return localforage.removeItem(null!);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        it('casts a float key to a String', function () {
            return localforage
                .setItem(537.35737 as any, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems([537.35737] as any);
                })
                .then(function (value) {
                    if (driverName === localforage.LOCALSTORAGE) {
                        return value;
                    }
                    expect(value).to.be.deep.eq({});

                    return localforage.getItems(['537.35737']);
                })
                .then(function (value) {
                    expect(value).to.be.deep.eq({ 537.35737: 'goodness!' });

                    return localforage.removeItem(537.35737 as any);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        // We do not monkey patch the driver.
        it('is not retrieved by getDriver [callback]', function () {
            const getDriver = promisifyTwo(localforage.getDriver, localforage);
            return getDriver(driverName).then(function (driver) {
                expect(typeof driver).to.be.eq('object');
                expect(driver._driver).to.be.eq(driverName);
                driverApiMethods.forEach(function (methodName) {
                    expect(driver[methodName as keyof typeof driver]).to.be.undefined;
                });
            });
        });

        it('is not retrieved by getDriver [promise]', function () {
            return localforage.getDriver(driverName).then(function (driver) {
                expect(typeof driver).to.be.eq('object');
                expect(driver._driver).to.be.eq(driverName);
                driverApiMethods.forEach(function (methodName) {
                    expect(driver[methodName as keyof typeof driver]).to.be.undefined;
                });
            });
        });
    });

    function prepareStorage(storageName: string) {
        // Delete IndexedDB storages (start from scratch)
        // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
        if (driverName === localforage.INDEXEDDB) {
            return new Promise(function (resolve) {
                indexedDB.deleteDatabase(storageName).onsuccess = resolve;
            });
        }

        // Otherwise, do nothing
        return Promise.resolve();
    }

    describe(driverName + ' driver multiple instances', function () {
        this.timeout(30000);

        let localforage2 = {} as LocalForageDriver;
        let localforage3 = {} as LocalForageDriver;

        before(function () {
            return prepareStorage('storage2').then(function () {
                localforage2 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename2'
                });

                // Same name, but different storeName since this has been
                // malfunctioning before w/ IndexedDB.
                localforage3 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename3'
                });

                return Promise.all([
                    localforage.setDriver(driverName),
                    localforage2.setDriver(driverName),
                    localforage3.setDriver(driverName)
                ]);
            });
        });

        beforeEach(function () {
            return Promise.all([localforage.clear(), localforage2.clear(), localforage3.clear()]);
        });

        it('is not be able to access values of other instances', function () {
            return Promise.all([
                localforage.setItem('key1', 'value1a'),
                localforage2.setItem('key2', 'value2a'),
                localforage3.setItem('key3', 'value3a')
            ]).then(function () {
                return Promise.all([
                    localforage.getItems(['key2']).then(function (values) {
                        expect(values).to.be.deep.eq({});
                    }),
                    localforage2.getItems(['key1']).then(function (values) {
                        expect(values).to.be.deep.eq({});
                    }),
                    localforage2.getItems(['key3']).then(function (values) {
                        expect(values).to.be.deep.eq({});
                    }),
                    localforage3.getItems(['key2']).then(function (values) {
                        expect(values).to.be.deep.eq({});
                    })
                ]);
            });
        });

        it('retrieves the proper value when using the same key with other instances', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage2.setItem('key', 'value2'),
                localforage3.setItem('key', 'value3')
            ]).then(function () {
                return Promise.all([
                    localforage.getItems(['key']).then(function (values) {
                        expect(values).to.be.deep.eq({ key: 'value1' });
                    }),
                    localforage2.getItems(['key']).then(function (values) {
                        expect(values).to.be.deep.eq({ key: 'value2' });
                    }),
                    localforage3.getItems(['key']).then(function (values) {
                        expect(values).to.be.deep.eq({ key: 'value3' });
                    })
                ]);
            });
        });
    });

    // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
    describe(driverName + ' driver multiple instances (concurrent on same database)', function () {
        this.timeout(30000);

        before(function () {
            return Promise.all([
                prepareStorage('storage3'),
                prepareStorage('commonStorage'),
                prepareStorage('commonStorage2'),
                prepareStorage('commonStorage3')
            ]);
        });

        it('chains operation on multiple stores', function () {
            const localforage1 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store1',
                size: 1024
            });

            const localforage2 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store2',
                size: 1024
            });

            const localforage3 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store3',
                size: 1024
            });

            const promise1 = localforage1
                .setItem('key', 'value1')
                .then(function () {
                    return localforage1.getItems(['key']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key: 'value1' });
                });

            const promise2 = localforage2
                .setItem('key', 'value2')
                .then(function () {
                    return localforage2.getItems(['key']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key: 'value2' });
                });

            const promise3 = localforage3
                .setItem('key', 'value3')
                .then(function () {
                    return localforage3.getItems(['key']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key: 'value3' });
                });

            return Promise.all([promise1, promise2, promise3]);
        });

        it('works on multiple instances of the same store', function () {
            let localforage1 = {} as LocalForageDriver;
            let localforage2 = {} as LocalForageDriver;
            let localforage3 = {} as LocalForageDriver;

            return Promise.resolve()
                .then(function () {
                    localforage1 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage1.ready();
                })
                .then(function () {
                    localforage2 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage2.ready();
                })
                .then(function () {
                    localforage3 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3.ready();
                })
                .then(function () {
                    return Promise.resolve()
                        .then(function () {
                            return localforage1
                                .setItem('key1', 'value1')
                                .then(function () {
                                    return localforage1.getItems(['key1']);
                                })
                                .then(function (values) {
                                    expect(values).to.be.deep.eq({ key1: 'value1' });
                                });
                        })
                        .then(function () {
                            return localforage2
                                .setItem('key2', 'value2')
                                .then(function () {
                                    return localforage2.getItems(['key2']);
                                })
                                .then(function (values) {
                                    expect(values).to.be.deep.eq({ key2: 'value2' });
                                });
                        })
                        .then(function () {
                            return localforage3
                                .setItem('key3', 'value3')
                                .then(function () {
                                    return localforage3.getItems(['key3']);
                                })
                                .then(function (values) {
                                    expect(values).to.be.deep.eq({ key3: 'value3' });
                                });
                        });
                });
        });

        it('works on multiple instances of the same store and concurrently', function () {
            let localforage1 = {} as LocalForageDriver;
            let localforage2 = {} as LocalForageDriver;
            let localforage3 = {} as LocalForageDriver;
            let localforage3b = {} as LocalForageDriver;

            return Promise.resolve()
                .then(function () {
                    localforage1 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage1.ready();
                })
                .then(function () {
                    localforage2 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage2.ready();
                })
                .then(function () {
                    localforage3 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3.ready();
                })
                .then(function () {
                    localforage3b = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3b.ready();
                })
                .then(function () {
                    const promise1 = localforage1
                        .setItem('key1', 'value1')
                        .then(function () {
                            return localforage1.getItems(['key1']);
                        })
                        .then(function (values) {
                            expect(values).to.be.deep.eq({ key1: 'value1' });
                        });

                    const promise2 = localforage2
                        .setItem('key2', 'value2')
                        .then(function () {
                            return localforage2.getItems(['key2']);
                        })
                        .then(function (values) {
                            expect(values).to.be.deep.eq({ key2: 'value2' });
                        });

                    const promise3 = localforage3
                        .setItem('key3', 'value3')
                        .then(function () {
                            return localforage3.getItems(['key3']);
                        })
                        .then(function (values) {
                            expect(values).to.be.deep.eq({ key3: 'value3' });
                        });

                    const promise4 = localforage3b
                        .setItem('key3', 'value3')
                        .then(function () {
                            return localforage3b.getItems(['key3']);
                        })
                        .then(function (values) {
                            expect(values).to.be.deep.eq({ key3: 'value3' });
                        });

                    return Promise.all([promise1, promise2, promise3, promise4]);
                });
        });

        it('can create multiple instances of the same store concurrently', function () {
            const localforage1 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage2 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage3 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage3b = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const promise1 = localforage1
                .setItem('key1', 'value1')
                .then(function () {
                    return localforage1.getItems(['key1']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key1: 'value1' });
                });

            const promise2 = localforage2
                .setItem('key2', 'value2')
                .then(function () {
                    return localforage2.getItems(['key2']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key2: 'value2' });
                });

            const promise3 = localforage3
                .setItem('key3', 'value3')
                .then(function () {
                    return localforage3.getItems(['key3']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key3: 'value3' });
                });

            const promise4 = localforage3b
                .setItem('key3', 'value3')
                .then(function () {
                    return localforage3b.getItems(['key3']);
                })
                .then(function (values) {
                    expect(values).to.be.deep.eq({ key3: 'value3' });
                });

            return Promise.all([promise1, promise2, promise3, promise4]);
        });
    });

    describe(driverName + ' driver when the callback throws an Error', function () {
        const testObj = {
            throwFunc: function () {
                testObj.throwFuncCalls++;
                throw new Error('Thrown test error');
            },
            throwFuncCalls: 0
        };

        beforeEach(function () {
            testObj.throwFuncCalls = 0;
        });

        it('resolves the promise of getItems()', function () {
            return localforage.getItems(['key'], testObj.throwFunc).then(function () {
                expect(testObj.throwFuncCalls).to.be.eq(1);
            });
        });
    });

    describe(driverName + ' driver when ready() gets rejected', function () {
        this.timeout(30000);

        let _oldReady: typeof localforage.ready;

        beforeEach(function () {
            _oldReady = localforage.ready;
            localforage.ready = function () {
                return Promise.reject(true);
            };
        });

        afterEach(function () {
            localforage.ready = _oldReady;
            _oldReady = null!;
        });

        driverApiMethods.forEach(function (methodName) {
            it('rejects ' + methodName + '() promise', function () {
                return (localforage as any)[methodName]().then(null, function (err: any) {
                    expect(err).to.be.true;
                });
            });
        });
    });
});

DRIVERS.forEach(function (driverName) {
    describe(driverName + ' driver instance', function () {
        before(patchGetItemsDeps);
        beforeEach(resetGetItemsDeps);
        after(unpatchGetItemsDeps);

        it('creates a new instance and sets the driver', function () {
            const localforage2 = localforage.createInstance({
                name: 'storage2',
                driver: driverName,
                // We need a small value here
                // otherwise local PhantomJS test
                // will fail with SECURITY_ERR.
                // TravisCI seem to work fine though.
                size: 1024,
                storeName: 'storagename2'
            });

            // since config actually uses setDriver which is async,
            // and since driver() and supports() are not defered (are sync),
            // we have to wait till an async method returns
            return localforage2
                .length()
                .then(
                    function () {
                        expect(localforage2.driver()).to.be.eq(driverName);
                        return localforage2.getItems(['']);
                    },
                    function (error: any) {
                        expect(error).to.be.instanceof(Error);
                        expect(error.message).to.be.eq('No available storage method found.');
                        expect(localforage.supports(driverName)).to.be.false;
                    }
                )
                .then(function () {
                    if (!localforage.supports(driverName)) {
                        return;
                    }
                    expectSpecificDriverCalled(driverName, localforage2);
                });
        });
    });
});

describe('unsupported driver', function () {
    before(patchGetItemsDeps);
    beforeEach(resetGetItemsDeps);
    after(unpatchGetItemsDeps);

    const dummyStorageDriver: import('@luiz-monad/localforage/dist/types').OptionalDropInstanceDriver =
        {
            _driver: 'dummyStorageDriver',
            _initStorage: () => Promise.resolve(),
            _support: true,
            iterate: localforage.iterate,
            getItem: localforage.getItem,
            setItem: localforage.setItem,
            removeItem: localforage.removeItem,
            clear: localforage.clear,
            length: localforage.length,
            key: localforage.key,
            keys: localforage.keys,
            dropInstance: localforage.dropInstance
        };

    it('sets a custom driver [callback]', function () {
        const defineDriver = promisifyTwo(localforage.defineDriver, localforage);
        return defineDriver(dummyStorageDriver).then(function () {
            const setDriver = promisifyTwo(localforage.setDriver, localforage);
            return setDriver(dummyStorageDriver._driver).then(function () {
                expect(localforage.driver()).to.be.eq(dummyStorageDriver._driver);
                const getItems = promisify(localforage.getItems, localforage);
                return getItems([]).then(function () {
                    expectSpecificDriverCalled(localforage.LOCALSTORAGE, localforage);
                });
            });
        });
    });

    it('sets a custom driver [promise]', function () {
        return localforage
            .defineDriver(dummyStorageDriver)
            .then(function () {
                return localforage.setDriver(dummyStorageDriver._driver);
            })
            .then(function () {
                expect(localforage.driver()).to.be.eq(dummyStorageDriver._driver);
                return localforage.getItems([]);
            })
            .then(function () {
                expectSpecificDriverCalled(localforage.LOCALSTORAGE, localforage);
            });
    });
});

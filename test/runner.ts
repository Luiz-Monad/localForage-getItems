// Run before window.onload to make sure the specs have access to describe()
// and other mocha methods. All feels very hacky though :-/
interface Title {
    title: string;
    parent: Title;
}

function runTestSuit() {
    mocha.setup('bdd');

    const runner = mocha.run();

    const failedTests: any[] = [];

    runner.on('end', function () {
        window.mochaResults = runner.stats;
        window.mochaResults.reports = failedTests;
    });

    function flattenTitles(test: Title) {
        const titles = [];

        while (test.parent.title) {
            titles.push(test.parent.title);
            test = test.parent;
        }

        return titles.reverse();
    }

    function logFailure(test: Title, err: Error) {
        failedTests.push({
            name: test.title,
            result: false,
            message: err.message,
            stack: err.stack,
            titles: flattenTitles(test)
        });
    }

    runner.on('fail', logFailure);
}

const require: any = globalThis.require;
if (require) {
    const paths = {
        '@luiz-monad/localforage': '/deps/localforage/localforage',
        'localforage-getitems': '/deps/localforage-getitems/localforage-getitems',
        chai: '/deps/chai/chai',
        mocha: '/deps/mocha/mocha'
    };
    requirejs.config({
        paths: paths
    });
    require(['@luiz-monad/localforage'], (localforage: LocalForageDriver) => {
        window.localforage = localforage;
        require(Object.keys(paths), () => {
            require(['test.api'], runTestSuit);
        });
    });
} else if (window.addEventListener) {
    window.addEventListener('load', runTestSuit);
} else if (window.attachEvent) {
    window.attachEvent('onload', runTestSuit);
}

export {};

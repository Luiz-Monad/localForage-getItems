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
    requirejs.config({
        baseUrl: '/deps/',
        paths: {
            config: 'config/config'
        }
    });
    require(['config'], (config: Record<string, string>) => {
        const alias = {
            'test.api': '/test/test.api'
        };
        requirejs.config({
            baseUrl: '/deps/',
            paths: { ...config, ...alias }
        });
        require(['localforage'], (localforage: LocalForageDriver) => {
            window.localforage = localforage;
            require(Object.keys(config), () => {
                mocha.ui();
                require(['test.api'], runTestSuit);
            });
        });
    });
} else if (window.addEventListener) {
    window.addEventListener('load', runTestSuit);
} else if (window.attachEvent) {
    window.attachEvent('onload', runTestSuit);
}

export {};

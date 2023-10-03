const path = require('path');
const glob = require('glob');

module.exports = exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        connect: {
            test: {
                options: {
                    base: path.resolve('../../build/'),
                    hostname: '*',
                    port: 9999,
                    middleware: function (connect, options, middlewares) {
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        },
        copy: {
            html: {
                expand: true,
                cwd: '../',
                src: '*.html',
                dest: '../../build/test/',
                filter: 'isFile'
            },
            css: {
                expand: true,
                cwd: '../../node_modules/',
                src: ['mocha/mocha.css'],
                dest: '../../build/',
                filter: 'isFile'
            }
        },
        shell: {
            build: {
                command: 'npm run build'
            }
        },
        watch: {
            test: {
                files: ['../../rollup.config.test.*', '../*.ts', '../**/*.ts', '../*.html'],
                tasks: ['build:test']
            },
            'mocha:unit': {
                files: ['../../build/test/*.js'],
                tasks: ['connect:test', 'mocha:unit']
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['connect', 'watch']);
    grunt.registerTask('build:test', ['shell:build', 'copy:html', 'copy:css']);
    grunt.registerTask('serve', ['connect:test', 'watch']);
    grunt.registerTask('test', ['build:test', 'connect:test', 'mocha']);

    grunt.registerTask('mocha', 'custom function to run mocha tests', function () {
        const { runner } = require('mocha-headless-chrome');
        const fs = require('fs');
        const done = this.async();
        const tempErrLogs = fs.createWriteStream('temp.test.log');
        const oldStdErr = process.stderr.write;
        let totaltestsPassed = 0;
        let totaltestsFailed = 0;
        let totalDuration = 0;
        const urls = ['http://localhost:9999/test/test.main.html'];

        grunt.util.async.forEachSeries(
            urls,
            async function (url, next) {
                const options = {
                    file: url, // test page path
                    reporter: 'dot', // mocha reporter name
                    width: 800, // viewport width
                    height: 600, // viewport height
                    timeout: 120000, // timeout in ms
                    executablePath: null, // chrome executable path
                    visible: false, // show chrome window
                    args: ['no-sandbox'] // chrome arguments
                };

                console.log('Testing: ' + url + '\n\n');
                process.stderr.write = tempErrLogs.write.bind(tempErrLogs);

                await runner(options)
                    .then((obj) => {
                        process.stderr.write = oldStdErr;
                        if (obj.result.stats.passes) {
                            totaltestsPassed += obj.result.stats.passes;
                            totalDuration += obj.result.stats.duration;
                        }

                        if (obj.result.stats.failures) {
                            totaltestsFailed += obj.result.stats.failures;
                        }
                    })
                    .catch((err) => {
                        process.stderr.write = oldStdErr;
                        console.error(err);
                        process.exit(1);
                    });
                next();
            },
            function () {
                grunt.log.oklns(totaltestsPassed + ' passed! (' + totalDuration / 1000 + 's)');

                if (totaltestsFailed > 0) {
                    grunt.log.errorlns(totaltestsFailed + ' failed!');
                    done(false);
                } else {
                    done(true);
                }
            }
        );
    });
};

'use strict';

/* eslint-disable no-process-exit */

const fs = require('fs');
const path = require('path');
const queue = require('d3-queue').queue;
const colors = require('colors/safe');
const template = require('lodash').template;

module.exports = function (directory, implementation, options, run) {
    const q = queue(1);
    const server = require('./server')();

    const tests = options.tests || [];

    function shouldRunTest(group, test) {
        if (tests.length === 0)
            return true;

        const id = `${group}/${test}`;

        for (let i = 0; i < tests.length; i++) {
            const k = id.indexOf(tests[i]);
            if (k === 0 || id[k - 1] === '-' || id[k - 1] === '/')
                return true;
        }

        return false;
    }

    q.defer(server.listen);

    fs.readdirSync(directory).forEach((group) => {
        if (group === 'index.html' || group === 'results.html.tmpl' || group[0] === '.')
            return;

        fs.readdirSync(path.join(directory, group)).forEach((test) => {
            if (!shouldRunTest(group, test))
                return;

            if (!fs.lstatSync(path.join(directory, group, test)).isDirectory() ||
                !fs.lstatSync(path.join(directory, group, test, 'style.json')).isFile())
                return;

            // https://api.mapbox.com/styles/v1/graphomap123/cis5tndft001shknj1a79ox43
            const style = JSON.parse('{"version":8,"name":"Modern (live)","metadata":{"mapbox:autocomposite":true,"mapbox:type":"template","mapbox:groups":{}},"center":[23.85741471406459,56.81800637254406],"zoom":15.461316270101728,"bearing":0,"pitch":0,"sources":{"composite":{"url":"mapbox://mapbox.mapbox-streets-v7","type":"vector"}},"sprite":"mapbox://sprites/graphomap123/cis5tndft001shknj1a79ox43","glyphs":"mapbox://fonts/graphomap123/{fontstack}/{range}.pbf","layers":[{"id":"background","type":"background","paint":{"background-color":"#e53422","background-opacity":1},"layout":{"visibility":"visible"}},{"layout":{"visibility":"visible"},"type":"fill","source":"composite","id":"landuse","paint":{"fill-color":"#313639","fill-opacity":0.7,"fill-pattern":"dot-pattern-max"},"source-layer":"landuse"},{"layout":{"visibility":"visible"},"type":"fill","source":"composite","id":"water","paint":{"fill-color":"hsl(45, 47%, 81%)","fill-antialias":true},"source-layer":"water"},{"minzoom":3,"layout":{"line-cap":"square"},"filter":["all",["==","$type","LineString"],["all",["!in","class","minor_rail","path"],["==","structure","bridge"]]],"type":"line","source":"composite","id":"bridges","paint":{"line-color":"#e53422","line-width":{"base":1.5,"stops":[[0,2],[22,150]]}},"source-layer":"road"},{"layout":{"visibility":"visible","line-cap":"round","line-join":"round"},"filter":["all",["==","$type","LineString"],["in","class","link","mini_roundabout","motorway","motorway_link","pedestrian","primary","secondary","street","street_limited","tertiary","trunk","turning_circle","turning_loop"]],"type":"line","source":"composite","id":"road","paint":{"line-color":"hsl(45, 47%, 81%)","line-width":{"base":1.5,"stops":[[0,0.1],[22,70]]},"line-blur":0,"line-translate":[0,0],"line-offset":0,"line-translate-anchor":"map"},"source-layer":"road"},{"minzoom":15,"layout":{"visibility":"visible","line-cap":"round","line-join":"round"},"filter":["all",["==","$type","LineString"],["in","class","service","track"]],"type":"line","source":"composite","id":"small-roads","paint":{"line-color":"hsl(45, 47%, 81%)","line-width":{"base":1.5,"stops":[[0,0.1],[22,70]]}},"source-layer":"road"},{"layout":{"visibility":"visible","line-cap":"butt","line-join":"round"},"filter":["all",["==","$type","LineString"],["all",["!=","type","subway"],["==","class","major_rail"]]],"type":"line","source":"composite","id":"rails","paint":{"line-color":"hsl(45, 47%, 81%)","line-width":{"base":1.5,"stops":[[0,0.1],[22,30]]},"line-dasharray":[2,1]},"source-layer":"road"},{"layout":{"visibility":"visible","line-cap":"butt","line-join":"round"},"filter":["all",["==","$type","LineString"],["all",["!in","type","footway","light_rail","narrow_gauge","subway","tram"],["==","structure","tunnel"]]],"type":"line","source":"composite","id":"tunnels","paint":{"line-width":{"base":1.5,"stops":[[0,0.1],[22,70]]},"line-dasharray":[1,1],"line-color":"#e53422"},"source-layer":"road"}],"created":"2016-08-22T09:09:49.406Z","id":"cis5tndft001shknj1a79ox43","modified":"2017-02-10T11:01:10.865Z","owner":"graphomap123","visibility":"private","draft":false}');

            server.localizeURLs(style);

            const params = Object.assign({
                group: group,
                test: test,
                width: 512,
                height: 512,
                pixelRatio: 1,
                allowed: 0.00015
            }, style.metadata && style.metadata.test);

            if (implementation === 'native' && process.env.BUILDTYPE === 'Release' && params.group === 'debug') {
                console.log(colors.gray(`* skipped ${params.group} ${params.test}`));
                return;
            }

            const skipped = params.skipped && params.skipped[implementation];
            if (skipped) {
                console.log(colors.gray(`* skipped ${params.group} ${params.test
                    } (${skipped})`));
                return;
            }

            if ('diff' in params) {
                if (typeof params.diff === 'number') {
                    params.allowed = params.diff;
                } else if (implementation in params.diff) {
                    params.allowed = params.diff[implementation];
                }
            }

            params.ignored = params.ignored && implementation in params.ignored;

            q.defer((callback) => {
                run(style, params, (err) => {
                    if (err) return callback(err);

                    if (params.ignored && !params.ok) {
                        params.color = '#9E9E9E';
                        console.log(colors.white(`* ignore ${params.group} ${params.test}`));
                    } else if (params.ignored) {
                        params.color = '#E8A408';
                        console.log(colors.yellow(`* ignore ${params.group} ${params.test}`));
                    } else if (!params.ok) {
                        params.color = 'red';
                        console.log(colors.red(`* failed ${params.group} ${params.test}`));
                    } else {
                        params.color = 'green';
                        console.log(colors.green(`* passed ${params.group} ${params.test}`));
                    }

                    callback(null, params);
                });
            });
        });
    });

    q.defer(server.close);

    q.awaitAll((err, results) => {
        if (err) {
            console.error(err);
            setTimeout(() => { process.exit(-1); }, 0);
            return;
        }

        results = results.slice(1, -1);

        if (process.env.UPDATE) {
            console.log(`Updated ${results.length} tests.`);
            process.exit(0);
        }

        let passedCount = 0,
            ignoreCount = 0,
            ignorePassCount = 0,
            failedCount = 0;

        results.forEach((params) => {
            if (params.ignored && !params.ok) {
                ignoreCount++;
            } else if (params.ignored) {
                ignorePassCount++;
            } else if (!params.ok) {
                failedCount++;
            } else {
                passedCount++;
            }
        });

        const totalCount = passedCount + ignorePassCount + ignoreCount + failedCount;

        if (passedCount > 0) {
            console.log(colors.green('%d passed (%s%)'),
                passedCount, (100 * passedCount / totalCount).toFixed(1));
        }

        if (ignorePassCount > 0) {
            console.log(colors.yellow('%d passed but were ignored (%s%)'),
                ignorePassCount, (100 * ignorePassCount / totalCount).toFixed(1));
        }

        if (ignoreCount > 0) {
            console.log(colors.white('%d ignored (%s%)'),
                ignoreCount, (100 * ignoreCount / totalCount).toFixed(1));
        }

        if (failedCount > 0) {
            console.log(colors.red('%d failed (%s%)'),
                failedCount, (100 * failedCount / totalCount).toFixed(1));
        }

        const resultsTemplate = template(fs.readFileSync(path.join(directory, 'results.html.tmpl'), 'utf8'));
        const p = path.join(directory, 'index.html');
        fs.writeFileSync(p, resultsTemplate({results: results}));
        console.log(`Results at: ${p}`);

        process.exit(failedCount === 0 ? 0 : 1);
    });
};

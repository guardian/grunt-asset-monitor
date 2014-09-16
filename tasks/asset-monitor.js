/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

    grunt.registerMultiTask('assetmonitor', 'Analyse and log static asset metrics', function () {

        var options = this.options({
            gzipLevel: 6,
            pretty: true,
            credentials: '/etc/gu/frontend.properties'
        });
        var analyse = require('./lib/analyse.js')(grunt, options);
        var done = this.async();

        grunt.util.async.forEachSeries(grunt.file.expand(this.data.src), function(path, next) {

            if(!grunt.file.exists(path)) {
                grunt.log.warn('Source file "' + path + '" not found.');
                next();
            }

            analyse(path, next);

        }, function() {
            done();
        });

    });

};

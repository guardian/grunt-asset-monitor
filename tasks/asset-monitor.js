/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

    var analyse = require('./lib/analyse.js')(grunt);

    grunt.registerMultiTask('assetmonitor', 'Analyse and log static asset metrics', function () {

        var done = this.async();

	    analyse.options = this.options({
            gzipLevel: 6,
            pretty: true,
            credentials: '/etc/gu/frontend.properties'
        });

        grunt.util.async.forEachSeries(grunt.file.expand(this.data.src), function(path, next) {

            if(!grunt.file.exists(path)) {
                grunt.log.warn('Source file "' + path + '" not found.');
                next();
            }

            analyse.it(path, next);

        }, function() {
            done();
        });

    });

};

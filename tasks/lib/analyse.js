/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

var cloudwatch = require('./cloudwatch'),
    css        = require('./css'),
    Q          = require('q'),
    path       = require('path'),
    _          = require('lodash');

module.exports = function(grunt, options) {

    var gzip = require('./gzip')(grunt, options);

    return function(filename, done) {
        grunt.log.subhead('Analysing ' + filename);

        //Get file size and compression data
        Q.all([gzip(filename), css(filename)])
            .spread(function(gzipData, cssData) {
                var data = _.assign(gzipData, cssData);
                //Log file sizes
                grunt.log.writeln('Uncompressed size: ' + String(data.uncompressedPretty).cyan);
                grunt.log.writeln('Compressed ' + String(data.compressedPretty).cyan);

                //Configure cloudwatch credentials
                return cloudwatch.configure(options.credentials).then(function(){
                    //Log metrics to cloudwatch
                    return cloudwatch.log(path.basename(filename), data);
                }).then(function(msg) {
                    grunt.log.writeln(String('Successfully logged file data to CloudWatch ' + msg.id).green);
                    return true;
                });
            //Exit and warn on error
            }).fail(function (error) {
                grunt.fail.warn(error);

            //Always step to the next file
            }).fin(function() {
                done();
            });

    };

};
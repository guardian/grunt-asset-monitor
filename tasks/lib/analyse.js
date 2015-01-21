/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

var cloudwatch = require('./cloudwatch'),
    StatsD     = require('node-statsd'),
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

                // Choose between CloudWatch and StatsD
                if (options.credentials) {
                    //Configure cloudwatch credentials
                    return cloudwatch.configure(options.credentials).then(function(){
                        //Log metrics to cloudwatch
                        return cloudwatch.log(path.basename(filename), data);
                    }).then(function(msg) {
                        grunt.log.writeln(String('Successfully logged file data to CloudWatch ' + msg.id).green);
                        return true;
                    });
                } else if (options.statsd) {
                    // Configure StatsD
                    var client = new StatsD(options.statsD),
                        fname = path.basename(filename);
                    // Set a prefix and the correct file name for StatsD
                    if (filename.lastIndexOf('.js') !== -1) {
                        fname = path.basename(filename, '.js');
                    } else if (filename.lastIndexOf('.css') !== -1) {
                        fname = path.basename(filename, '.css');
                    }
                    // Gauge compressed and Uncompressed. They are sent in one request when the callback is triggered
                    client.gauge(fname+'.compressed', data.compressedPretty);
                    return client.gauge(fname+'.uncompressed', data.uncompressedPretty, 1, null, function() {
                        grunt.log.writeln(String('Successfully logged '+fname+' to StatsD ').green);
                        return true;
                    });
                } else {
                    grunt.fail.warn("Neither CloudWatch or StatsD configured. Set these options in your config");
                }
            //Exit and warn on error
            }).fail(function (error) {
                grunt.fail.warn(error);

            //Always step to the next file
            }).fin(function() {
                done();
            });

    };

};
/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var Q = require('q');
var prettySize = require('prettysize');
var zlib = require('zlib');
var cloudwatch = require('./cloudwatch');
var CSS = require('./css');

module.exports = function(grunt) {

    var exports = {
        options: {}
    };

    exports.gzip = function(filename) {
        var deferred = Q.defer();
        var file = path.basename(filename);
        var dest = 'tmp/' + file + '.gz';

        // Make tmp directory
        grunt.file.mkdir(path.dirname(dest));

        var srcStream = fs.createReadStream(filename);
        var destStream = fs.createWriteStream(dest);
        var compressor = zlib.createGzip.call(zlib, exports.options);

        compressor.on('error', function(err) {
            grunt.file.delete('tmp', {force: true});
            deferred.reject(new Error('GZip compression of ' + filename + ' failed.'));
        });

        destStream.on('close', function() {
            deferred.resolve({
                filename: file,
                data: {
                    uncompressed: Number((exports.getSize(filename, false) / 1024).toFixed(1)),
                    uncompressedPretty: exports.getSize(filename, true),
                    compressed: Number((exports.getSize(dest, false) / 1024).toFixed(1)),
                    compressedPretty: exports.getSize(dest, true)
                }
            });
            grunt.file.delete('tmp', {force: true});
        });

        srcStream.pipe(compressor).pipe(destStream);

        return deferred.promise;
    };

    exports.css = function(filename, fileData) {
        var deferred = Q.defer();
        if(path.extname(filename) === '.css') {
            CSS.metrics(filename).then(function(cssData) {
                fileData.data.rules = cssData.rules;
                fileData.data.totalSelectors = cssData.totalSelectors;
                fileData.data.averageSelectors = cssData.averageSelectors;

                deferred.resolve(fileData);
            }) ;
        } else {
            deferred.resolve(fileData);
        }
        return deferred.promise;
    };

    exports.getSize = function(filename, pretty) {
        var size = 0;
        if (typeof filename === 'string') {
            try {
                size = fs.statSync(filename).size;
            } catch (e) {}
        } else {
            size = filename;
        }
        if (pretty !== false) {
            if (!exports.options.pretty) {
                return size + ' bytes';
            }
            return prettySize(size);
        }
        return Number(size);
    };

    exports.it = function(filename, done) {
        grunt.log.subhead('Analysing ' + filename);

        //Get file size and compression data
        exports.gzip(filename).then(function(fileData) {
            //Log file sizes
            grunt.log.writeln('Uncompressed size: ' + String(fileData.data.uncompressedPretty).cyan);
            grunt.log.writeln('Compressed ' + String(fileData.data.compressedPretty).cyan);

            return exports.css(filename, fileData);
        }).then(function(fileData){
            //Configure cloudwatch credentials
            return cloudwatch.configure(exports.options.credentials).then(function(){
                //Log metrics to cloudwatch
                return cloudwatch.log(fileData.filename, fileData.data);
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

    return exports;
};
'use strict';

var fs         = require('fs'),
    path       = require('path'),
    Q          = require('q'),
    prettySize = require('prettysize'),
    zlib       = require('zlib'),
    grunt      = require('grunt');

module.exports = function(grunt, options) {

    function getSize(filename, pretty) {
        var size = 0;
        if (typeof filename === 'string') {
            try {
                size = fs.statSync(filename).size;
            } catch (e) {}
        } else {
            size = filename;
        }
        if (pretty !== false) {
            if (!options.pretty) {
                return size + ' bytes';
            }
            return prettySize(size);
        }
        return Number(size);
    };

    return function(filename) {

        var deferred = Q.defer();
        var file = path.basename(filename);
        var dest = 'tmp/' + file + '.gz';

        // Make tmp directory
        grunt.file.mkdir(path.dirname(dest));

        var srcStream = fs.createReadStream(filename);
        var destStream = fs.createWriteStream(dest);
        var compressor = zlib.createGzip.call(zlib, options);

        compressor.on('error', function(err) {
            grunt.file.delete('tmp', {force: true});
            deferred.reject(new Error('GZip compression of ' + filename + ' failed.'));
        });

        destStream.on('close', function() {
            deferred.resolve({
                uncompressed: Number((getSize(filename, false) / 1024).toFixed(1)),
                uncompressedPretty: getSize(filename, true),
                compressed: Number((getSize(dest, false) / 1024).toFixed(1)),
                compressedPretty: getSize(dest, true)
            });
            grunt.file.delete('tmp', {force: true});
        });

        srcStream.pipe(compressor).pipe(destStream);

        return deferred.promise;
    };

};
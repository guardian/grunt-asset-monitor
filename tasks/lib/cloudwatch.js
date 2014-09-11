/*
 * grunt-asset-monitor
 * https://github.com/guardian/grunt-asset-monitor
 *
 * Copyright (c) 2013 Patrick Hamann, contributors
 * Licensed under the MIT license.
 */
'use strict';

var fs  = require('fs'),
    Q   = require('q'),
    AWS = require('aws-sdk'),
    cloudwatch;

module.exports = {

    getProperty : function(property, file) {
        return file.toString().split('\n').filter(function(line) {
            return line.search(property) !== -1;
        })[0].split('=')[1];
    },

    configure: function(filename) {
        var deferred = Q.defer();

        fs.readFile(filename, { encoding: 'utf-8'}, function(err, data) {
            if(err) {
                deferred.reject(new Error('Failed to read AWS credentials from file'));
            }

            AWS.config.update({
                region: 'eu-west-1',
                accessKeyId: module.exports.getProperty('aws.access.key', data),
                secretAccessKey: module.exports.getProperty('aws.access.secret.key', data)
            });

           cloudwatch = new AWS.CloudWatch();

            deferred.resolve({});
        });

        return deferred.promise;
    },

    log : function(metricName, metricData) {

        var deferred = Q.defer();

        var params = {
            Namespace : 'Assets',
            MetricData : [
                {
                    MetricName : metricName,
                    Value : metricData.uncompressed,
                    Unit : 'Kilobytes',
                    Dimensions : [
                        {
                            Name : 'Compression',
                            Value : 'None'
                        }
                    ]
                },
                {
                    MetricName : metricName,
                    Value : metricData.compressed,
                    Unit : 'Kilobytes',
                    Dimensions : [
                        {
                            Name : 'Compression',
                            Value : 'GZip'
                        }
                    ]
                }
            ]
        };

        if(metricData.rules) {
            params.MetricData.push({
                MetricName : metricName,
                Value : metricData.rules,
                Unit : 'Count',
                Dimensions : [
                    {
                        Name : 'Metric',
                        Value : 'Rules'
                    }
                ]
            });
        }

        if(metricData.totalSelectors) {
            params.MetricData.push({
                MetricName : metricName,
                Value : metricData.totalSelectors,
                Unit : 'Count',
                Dimensions : [
                    {
                        Name : 'Metric',
                        Value : 'Total Selectors'
                    }
                ]
            });
        }

        if(metricData.averageSelectors) {
            params.MetricData.push({
                MetricName : metricName,
                Value : metricData.averageSelectors,
                Unit : 'Count',
                Dimensions : [
                    {
                        Name : 'Metric',
                        Value : 'Average Selectors'
                    }
                ]
            });
        }

        cloudwatch.putMetricData(params, function (err, data) {
            if (err) {
                deferred.reject(new Error('Failed to log metrics to cloudwatch: ' + err));
            } else {
                deferred.resolve({ file: metricName, id: data.ResponseMetadata.RequestId });
            }
        });

        return deferred.promise;
    }
};

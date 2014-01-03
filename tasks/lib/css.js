'use strict';
var parse = require('css-parse'),
    fs = require('fs'),
    Q = require('q');

module.exports = {

    metrics: function (path) {
        var deferred = Q.defer();

        fs.readFile(path, { encoding: 'utf-8'}, function(err, data) {
            if(err) {
                deferred.reject(new Error('Failed to read CSS file data'));
            }

            var parsedData = parse(data).stylesheet;
            var rules = parsedData.rules.length;
            var selectors = function() {
                var totalSelectors = 0,
                    l = rules;

                for(var i=0; i < l; i++) {
                    var rule = parsedData.rules[i];
                    if(rule.type === 'rule') {
                        totalSelectors += parsedData.rules[i].selectors.length;
                    }
                }
                return totalSelectors;
            };

            deferred.resolve({
                rules: rules,
                totalSelectors: selectors(),
                averageSelectors: +(selectors() / rules).toFixed(1)
            });
        });

        return deferred.promise;
    }
};

grunt-asset-monitor
===================

Grunt task to analyse and log simple metrics of static assets to Amazon CloudWatch or StatsD.

This is tasks is used by the [Guardian's](http://www.theguardian.com/uk?view=mobile) frontend web project to monitor the performance of their client-side assets.
Once the data is in CloudWatch/StatsD it can then be used to set alert thresholds when certain assets get too large.

![Output screenshot](http://cl.ly/image/3343153U1D25/Screenshot%20from%202013-12-24%2014%3A19%3A38.png)

## Getting Started

This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-asset-monitor --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-asset-monitor');
```
## Options

### credentials

Type: `String`
Default: `/etc/gu/frontend.properties`

Location of your properties file containing your AWS api credentials. This should be a raw utf-8 text file with key=value pairs:
```
aws.access.region=YOUREGION
aws.access.key=YOURKEY
aws.access.secret.key=YOURSECRET
```

### statsd

Type: `Object`
Default: `null`

JSON object describing your connection to StatsD. Specifying anything other than null for this property will send the analysis to statsD with the default paramers. We use [node-statsd](https://github.com/sivy/node-statsd) to send these messages, so please refer to this documentation for the latest information. Default parameters are:
```js
statsd: {
    host: 'localhost',
    port: '8125',
    prefix: '',
    suffix: '',
    globalize: false,
    cacheDns: false,
    mock: false,
    global_tags: []
}
```

### gzipLevel

Type: `Number`
Default: `6`

Level of GZip compression to use to generate compressed file size output.

### pretty

Type: `Boolean`
Default: `true`

Whether to convert file size output to human readable format, example: ```245.2 Kb```

## Examples

### Configuration Example

Basic example of a Grunt config containing the monitor task.
```js
grunt.initConfig({
        assetmonitor: {
            dev: {
                src: [
                    'javascripts/app.js',
                    'stylesheets/global.css'
                ],
                options: {
                    credentials: '/etc/aws.properties'
                }
            }
        },
});

grunt.loadNpmTasks('grunt-asset-monitor');

grunt.registerTask('default', ['monitor']);
```

### StatsD

Running monitor to StatsD. This will use the default host and port of localhost:8125
```js
assetmonitor: {
  dist: {
    src: [
      'javascripts/app.js',
      'stylesheets/global.css'
    ],
    options: {
        statsd: {
            prefix: "gu.assets"
        }
    }
  }
}
```

### Multiple Files

Running monitor against multiple CSS files. All the files specified in the `src` array will be analyzed by grunt-asset-monitor.
```js
assetmonitor: {
  dist: {
    src: [
      'javascripts/app.js',
      'stylesheets/global.css'
    ]
  }
}
```

### Specifying Options

Example of using the [options](https://github.com/guardian/grunt-asset-monitor#options).

```js
assetmonitor: {
    dev: {
        src: [
            'test/*.min.css'
        ],
        options: {
            gzipLevel: 4,
            pretty: true,
            credentials: 'aws.properties'
        }
    }
}
```

### Specifying Files with Glob Pattern

Example of using a glob pattern to target many files that should be analysed by asset-monitor. The example below will analyse all the files in the `css` directory that have an extension of `.css`.

```js
assetmonitor: {
  dist: {
    src: ['css/*.css']
  }
}
```

##Todo

* ~~Use [grunt-css-metrics](https://github.com/phamann/grunt-css-metrics) task to gather additional CSS metrics~~
* Use [Esprima](http://esprima.org/) to gather additional JS metrics
* Write unit tests

## Release History

### 0.1.0 (23rd December 2013)
### 0.1.3 (2nd January 2014)
### 0.1.4 (3rd January 2014)
### 0.1.5 (27th January 2014)


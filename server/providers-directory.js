var express = require('express'),
    fs = require('fs'),
    url = require('url'),
    _ = require('underscore')._,
    path = require('path');

module.exports = function(app, settings) {

  // TODO: now requires absolute paths; change?
  app.get('/provider/directory/file*', function(req, res) {
      // TODO: make path secure!
      res.sendfile(path.join(settings.providers.directory.path, req.params[0]),
          function(err, path) {
              if (err) {
                  res.send({
                      status: false
                  });
              }
      });
  });

  function formatbyte(n) {
    return (Math.ceil(parseInt(n) / 1048576)) + ' MB';
  }

  var lsR = function(base_dir) {
    return _.reduce(fs.readdirSync(base_dir), function(memo, item) {
        var p = path.join(base_dir, item);
        var stat = fs.statSync(p);
        if (stat.isDirectory()) {
            var l = lsR(p);
            memo = memo.concat(l);
        } else {
            memo.push([p, stat]);
        }
        return memo;
    }, []);
    return result;
  };

  var lsFilter = function(files, re) {
    return _.filter(files, function(f) {
        return f[0].match(re);
    });
  };

  var isRaw = function(filename) {
      return filename.match(/(.shp|.geojson)/i);
  };

  var toObjects = function(files, base_dir, port) {
    return _.map(files, function(f) {
        return isRaw(f[0]) ? {
            url: url.format({
                protocol: 'file:',
                host: 'localhost',
                pathname: f[0].replace(base_dir, '')
            }),
            bytes: formatbyte(f[1].size),
            id: path.basename(f[0])
        } :
        // files that require processing
        {
            url: url.format({
                host: 'localhost:' + port,
                protocol: 'http:',
                pathname: path.join('/provider/directory/file/',
                    f[0].replace(base_dir, ''))
            }),
            bytes: formatbyte(f[1].size),
            id: path.basename(f[0])
        }
    });
  };

  return {
    name: 'Local Files',
    settings: settings,
    objects: function(callback) {
      var settings = this.settings.providers.directory;
      callback(toObjects(
        lsFilter(lsR(settings.path), /(.zip|.geojson|.shp)/i),
        settings.path,
        this.settings.port));
    }
  };
};
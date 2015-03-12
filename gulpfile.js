/* jshint node:true */
'use strict';
// generated on 2015-02-18 using generator-gulp-webapp 0.2.0
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.plumber())
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10
    }))
    .pipe($.autoprefixer({browsers: ['last 1 version']}))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('origami-css', function () {
  var http = require('http');
  var options = {
      host: 'build.origami.ft.com',
      path: '/bundles/css?modules=o-ft-header@^2.5.15,o-ft-footer@^2.0.4,o-table@^1.6.0'
  }
  var request = http.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) {
          data += chunk;
      });
      res.on('end', function () {
        var fs = require('fs');
        fs.writeFile("./bower_components/origami/build.scss", data, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("Origami CSS was updated!");
        }); 
      });
  });
  request.on('error', function (e) {
      console.log(e.message);
  });
  request.end();
});

gulp.task('origami-js', function () {
  var http = require('http');
  var options = {
      host: 'build.origami.ft.com',
      path: '/bundles/js?modules=o-ft-header@^2.5.15,o-table@^1.6.0'
  }
  var request = http.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) {
          data += chunk;
      });
      res.on('end', function () {
        var fs = require('fs');
        fs.writeFile("./bower_components/origami/build.js", data, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("Origami JS was updated!");
        }); 
      });
  });
  request.on('error', function (e) {
      console.log(e.message);
  });
  request.end();
});

gulp.task('origami', function () {
  gulp.start('origami-css').start('origami-js');
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('html', ['styles'], function () {
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('api', function () {
  return gulp.src('app/api/**/*')
    .pipe(gulp.dest('dist/api'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('app/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('connect', ['styles'], function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('.tmp'))
    .use(serveStatic('app'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect', 'watch'], function () {
  require('opn')('http://localhost:9000');
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep())
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep())
    .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect'], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*',
    'app/api/**/*'
  ]).on('change', $.livereload.changed);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('publish', ['build'], function () {
  return gulp.src('dist/**/*')
    .pipe(gulp.dest('../ft/olizh.github.io/'));
});

gulp.task('build', ['jshint', 'html', 'images', 'fonts', 'extras', 'api'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build').start('publish');
});

'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var fs = require('fs');
var del = require('del');
var path = require('path');
var mkdirp = require('mkdirp');
var isparta = require('isparta');
var esperanto = require('esperanto');

var manifest = require('./package.json');
var config = manifest.babelBoilerplateOptions;
var mainFile = manifest.main;
var destinationFolder = path.dirname(mainFile);
var exportFileName = path.basename(mainFile, path.extname(mainFile));

// Remove the built files
gulp.task('clean', function(cb) {
  del([destinationFolder], cb);
});

// Remove our temporary files
gulp.task('clean-tmp', function(cb) {
  del(['tmp'], cb);
});

function test() {
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js', 'test/spec/**/*.js', '!test/spec/atom-shell/**/*'], {read: false})
    .pipe($.mocha({reporter: 'dot', globals: config.mochaGlobals, timeout: 100000}));
}

// Lint our source code
gulp.task('lint-src', function() {
  return gulp.src(['src/**/*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

// Lint our test code
gulp.task('lint-test', function() {
  return gulp.src(['test/**/*.js', '!test/spec/atom-shell/**/*'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

// Build two versions of the library
gulp.task('build', ['lint-src', 'clean'], function(done) {
  esperanto.bundle({
    base: 'src',
    entry: config.entryFileName
  }).then(function(bundle) {
    var res = bundle.toUmd({
      sourceMap: true,
      sourceMapSource: config.entryFileName + '.js',
      sourceMapFile: exportFileName + '.js',
      name: config.exportVarName
    });

    // Write the generated sourcemap
    mkdirp.sync(destinationFolder);
    fs.writeFileSync(path.join(destinationFolder, exportFileName + '.js'), res.map.toString());

    $.file(exportFileName + '.js', res.code, { src: true })
      .pipe($.plumber())
      .pipe($.sourcemaps.init({ loadMaps: true }))
      .pipe($.babel({ blacklist: ['useStrict'] }))
      .pipe($.sourcemaps.write('./', {addComment: false}))
      .pipe(gulp.dest(destinationFolder))
      .pipe($.filter(['*', '!**/*.js.map']))
      .pipe($.rename(exportFileName + '.min.js'))
      .pipe($.uglifyjs({
        outSourceMap: true,
        inSourceMap: destinationFolder + '/' + exportFileName + '.js.map'
      }))
      .pipe(gulp.dest(destinationFolder))
      .on('end', done);
  })
  .catch(done);
});

gulp.task('coverage', ['lint-src', 'lint-test'], function(done) {
  require('babel/register')({ modules: 'common' });
  gulp.src(['src/*.js'])
    .pipe($.istanbul({ instrumenter: isparta.Instrumenter }))
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      return test()
      .pipe($.istanbul.writeReports())
      .on('end', done);
    });
});

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
  require('babel/register')({ modules: 'common' });
  return test();
});

// Run the headless unit tests as you make changes.
gulp.task('watch', ['test'], function() {
  gulp.watch(['src/**/*', 'test/**/*', '.eslintrc', 'test/.jshintrc'], ['test']);
});

// An alias of test
gulp.task('default', ['test']);

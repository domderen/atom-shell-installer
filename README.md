# Atom Shell Installer

### Can be used with Gulp build system.

[![Build status](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva/branch/master?svg=true)](https://ci.appveyor.com/project/bhaal275/atom-shell-installer/branch/master)

Module that builds Windows installers for
[Atom Shell](https://github.com/atom/atom-shell) apps using
[Squirrel](https://github.com/Squirrel/Squirrel.Windows).

## Installing

```sh
npm install --save-dev atom-shell-installer
```

## Configuring

In your `gulpfile.js` add the following:

```js
var gulp = require('gulp');
var atomShellInstaller = require('atom-shell-installer');

gulp.task('create-windows-installer', function (done) {
  atomShellInstaller({
    appDirectory: 'path/to/atom-shell',
    outputDirectory: 'installer',
    exe: 'atom.exe'
  }).then(function () {
    done();
  });
});
}
```

This assumes you have an Atom Shell app built at the given `appDirectory`, and your application files are available at `${appDirectory}/resources/app/` or `${appDirectory}/resources/app.asar`.

Then run `gulp create-windows-installer` and you will have an `.nupkg`, a
`RELEASES` file, and a `.exe` installer file in the `outputDirectory` folder.

##Advanced Configuring

So you build an Atom-Shell application, and you want to start distributing it, you can add following tasks to your gulpfile:

```js
// Npm modules required for this setup.
var gulp = require('gulp');
var downloadatomshell = require('gulp-download-atom-shell');
var rimraf = require('rimraf');
var asar = require('gulp-asar');
var atomShellInstaller = require('atom-shell-installer');

// A task to download Atom-Shell utilizing https://github.com/r0nn/gulp-download-atom-shell
// It downloads atom-shell with the specified version, and unpacks it to a provided directory.
gulp.task('download', function (cb) {
  downloadatomshell({
    version: '0.22.3',
    outputDir: 'cache'
  }, cb);
});

// A cleanup task to keep our distribution preparation fresh.
// It cleans a directory that is next used as a start position to creating an installer.
gulp.task('clean-dist', function (cb) {
  rimraf('./dist', cb);
});

// Task to copy the downloaded atom-shell into the distribution directory.
gulp.task('copy-atom', ['clean-dist'], function () {
  return gulp.src('./cache/**/*')
      .pipe(gulp.dest('dist/'));
});

// Task that copies all necessary app files into atom-shell resources/app directory.
// This is a default directory used by atom-shell.
// Copy there all files that your application needs to run properly.
gulp.task('prepFiles', ['clean-dist', 'copy-atom'], function () {
  return gulp.src(['./node_modules/**/*', './resources/**/*', './build/**/*', './package.json'], { base: './'})
    .pipe(gulp.dest('dist/resources/app'));
});

// Task to create an asar archive out of files required to run the application.
// This solves too long path issues on Windows.
gulp.task('create-archive', ['clean-dist', 'prepFiles'], function() {
  return gulp.src('dist/resources/app/**/*')
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('dist/resources'));
});

// Task to clean no longer required resources/app folder as we now have the asar package.
gulp.task('clean-app', ['clean-dist', 'create-archive'], function (cb) {
  rimraf('./dist/resources/app', cb);
});

// Final task to create the installer and save it in the ./installer/ directory.
gulp.task('create-windows-installer', ['clean-app'], function (done) {
  atomShellInstaller({
    appDirectory: 'dist',
    outputDirectory: 'installer',
    exe: 'atom.exe'
  }).then(function () {
    done();
  });
});
```

## Configuration parameters

There are several configuration settings supported:

| Config Name           | Required | Description |
| --------------------- | -------- | ----------- |
| `appDirectory`        | Yes      | The folder path of your Atom Shell-based app |
| `outputDirectory`     | No       | The folder path to create the `.exe` installer in. Defaults to the `installer` folder at the project root. |
| `loadingGif`          | No       | The local path to a `.gif` file to display during install. |
| `authors`             | Yes      | The authors value for the nuget package metadata. Defaults to the `author` field from your app's package.json file when unspecified. |
| `owners`              | No       | The owners value for the nuget package metadata. Defaults to the `authors` field when unspecified. |
| `exe`                 | No       | The name of your app's main `.exe` file. This uses the `name` field in your app's package.json file with an added `.exe` extension when unspecified. |
| `description`         | No       | The description value for the nuget package metadata. Defaults to the `description` field from your app's package.json file when unspecified. |
| `version`             | No       | The version value for the nuget package metadata. Defaults to the `version` field from your app's package.json file when unspecified. |
| `title`               | No       | The title value for the nuget package metadata. Defaults to the `productName` field and then the `name` field from your app's package.json file when unspecified. |
| `certificateFile`     | No       | The path to an Authenticode Code Signing Certificate |
| `certificatePassword` | No       | The password to decrypt the certificate given in `certificateFile` |
| `signWithParams`      | No       | Params to pass to signtool.  Overrides `certificateFile` and `certificatePassword`. |
| `setupIcon`           | No       | The ICO file to use as the icon for the generated Setup.exe |
| `remoteReleases`      | No       | A URL to your existing updates. If given, these will be downloaded to create delta updates |

## Sign your installer or else bad things will happen

For development / internal use, creating installers without a signature is okay, but for a production app you need to sign your application. Internet Explorer's SmartScreen filter will block your app from being downloaded, and many anti-virus vendors will consider your app as malware unless you obtain a valid cert.

Any certificate valid for "Authenticode Code Signing" will work here, but if you get the right kind of code certificate, you can also opt-in to [Windows Error Reporting](http://en.wikipedia.org/wiki/Windows_Error_Reporting). [This MSDN page](http://msdn.microsoft.com/en-us/library/windows/hardware/hh801887.aspx) has the latest links on where to get a WER-compatible certificate. The "Standard Code Signing" certificate is sufficient for this purpose.

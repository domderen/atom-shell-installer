'use strict';

import path from 'path';

import fs from 'fs-promise';
import Promise from 'bluebird';
import temp from 'temp';
import dot from 'dot';

import Util from './Util';

class InstallerFactory {
  constructor({
    appDirectory,
    outputDirectory = 'installer',
    loadingGif = path.resolve(__dirname, '..', 'resources', 'install-spinner.gif'),
    authors,
    owners,
    exe,
    iconUrl = 'https://raw.githubusercontent.com/atom/atom-shell/master/atom/browser/resources/win/atom.ico',
    description,
    version,
    title,
    certificateFile,
    certificatePassword,
    signWithParams,
    setupIcon,
    remoteReleases
  } = {}) {
    if(Util.isEmpty(appDirectory)) {
      throw new Error('Please provide "appDirectory" config parameter.');
    }

    try {
      const appMetadata = Util.getPackageJson(appDirectory);
      this.appDirectory = appDirectory;
      this.outputDirectory = path.resolve(outputDirectory);
      this.loadingGif = path.resolve(loadingGif);
      this.authors = authors || appMetadata.author || '';
      this.owners = owners || this.authors;
      this.name = appMetadata.name;
      this.exe = exe || this.name;
      this.iconUrl = iconUrl;
      this.description = description || appMetadata.description;
      this.version = version || appMetadata.version;
      this.productName = appMetadata.productName;
      this.title = title || this.productName || this.name;
      this.certificateFile = certificateFile;
      this.certificatePassword = certificatePassword;
      this.signWithParams = signWithParams;
      this.setupIcon = setupIcon;
      this.remoteReleases = remoteReleases;
    } catch (error) {
      throw error;
    }
  }
  syncReleases() {
    if(this.remoteReleases) {
      const cmd = path.resolve(__dirname, '..', 'vendor', 'SyncReleases.exe');
      const args = ['-u', this.remoteReleases, '-r', this.outputDirectory];
      return Util.exec(cmd, args);
    } else {
      return Promise.resolve();
    }
  }
  update(nugetOutput) {
    const nupkgPath = path.join(nugetOutput, `${this.name}.${this.version}.nupkg`);
    const cmd = path.resolve(__dirname, '..', 'vendor', 'Update.com');
    const args = [
      '--releasify',
      nupkgPath,
      '--releaseDir',
      this.outputDirectory,
      '--loadingGif',
      this.loadingGif
    ];

    if (this.signWithParams) {
      args.push('--signWithParams');
      args.push(this.signWithParams);
    }
    else if (this.certificateFile && this.certificatePassword) {
      args.push('--signWithParams');
      args.push(`/a /f \"${path.resolve(this.certificateFile)}\" /p \"${this.certificatePassword}\"`);
    }

    if (this.setupIcon) {
      const setupIconPath = path.resolve(this.setupIcon);
      args.push('--setupIcon');
      args.push(setupIconPath);
    }

    return Util.exec(cmd, args);
  }
  updateSetupFile() {
    if(this.productName) {
      const setupPath = path.join(this.outputDirectory, `${this.productName}Setup.exe`);
      fs.renameSync(path.join(this.outputDirectory, 'Setup.exe'), setupPath);
    }

    return Promise.resolve();
  }
	createInstaller() {
    // Start tracking temporary directories
    temp.track();

    // Bundle Update.exe with the app
    fs.copySync(path.resolve(__dirname, '..', 'vendor', 'Update.exe'), path.join(this.appDirectory, 'Update.exe'));

    // Read the contents of template.nuspec file
    const template = dot.template(fs.readFileSync(path.join('template.nuspec')));

    // Fill the template with provided configuration parameters
    const nuspecContent = template({
      name: this.name,
      title: this.title,
      version: this.version,
      authors: this.authors,
      owners: this.owners,
      iconUrl: this.iconUrl,
      description: this.description,
      exe: this.exe
    });

    // Create temporary directory for the installer
    const nugetOutput = temp.mkdirSync('squirrel-installer-');
    const targetNuspecPath = path.join(nugetOutput, `${this.name}.nuspec`);
    fs.writeFileSync(targetNuspecPath, nuspecContent);

    const cmd = path.resolve(__dirname, '..', 'vendor', 'nuget.exe');
    const args = [
      'pack',
      targetNuspecPath,
      '-BasePath',
      path.resolve(this.appDirectory),
      '-OutputDirectory',
      nugetOutput,
      '-NoDefaultExcludes'
    ];


    return Util.exec(cmd, args)
      .then(() => this.syncReleases())
      .then(() => this.update(nugetOutput))
      .then(() => this.updateSetupFile());
	}
}

export default InstallerFactory;

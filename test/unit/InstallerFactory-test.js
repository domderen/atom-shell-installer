/*global describe it expect beforeEach afterEach*/
'use strict';

import path from 'path';

import Promise from 'bluebird';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fs from 'fs-promise';
import temp from 'temp';
import dot from 'dot';
chai.use(sinonChai);

import InstallerFactory from '../../src/InstallerFactory';
import Util from '../../src/Util';

describe('InstallerFactory', () => {

  describe('constructor', () => {
    let getPackageJsonStub;

    beforeEach(() => {
      getPackageJsonStub = sinon.stub(Util, 'getPackageJson');
    });

    afterEach(() => {
      Util.getPackageJson.restore();
    });

    it('should throw error on missing "appDirectory" parameter', () => expect(InstallerFactory).to.throw(Error));

    it('should throw error when unable to find and read package.json', () => {
      getPackageJsonStub.throws(new Error('package json related error'));

      expect(() => new InstallerFactory({appDirectory: 'incorrectDir'})).to.throw('package json related error');
      expect(getPackageJsonStub.calledWith('incorrectDir')).to.equal(true);
    });

    it('should create default public properties on construction', () => {
      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir'});

      expect(getPackageJsonStub.calledWith('correctDir')).to.equal(true);
      expect(installerFactory.appDirectory).to.equal('correctDir');
      expect(installerFactory.outputDirectory).to.equal(path.resolve('installer'));
      expect(installerFactory.loadingGif).to.equal(path.resolve('resources', 'install-spinner.gif'));
      expect(installerFactory.authors).to.equal('some author');
      expect(installerFactory.owners).to.equal('some author');
      expect(installerFactory.name).to.equal('some name');
      expect(installerFactory.exe).to.equal('some name');
      expect(installerFactory.iconUrl).to.equal('https://raw.githubusercontent.com/atom/atom-shell/master/atom/browser/resources/win/atom.ico');
      expect(installerFactory.description).to.equal('some desc');
      expect(installerFactory.version).to.equal('123');
      expect(installerFactory.productName).to.equal('some product name');
      expect(installerFactory.title).to.equal('some product name');
      expect(installerFactory.certificateFile).to.equal(undefined);
      expect(installerFactory.certificatePassword).to.equal(undefined);
      expect(installerFactory.signWithParams).to.equal(undefined);
      expect(installerFactory.setupIcon).to.equal(undefined);
      expect(installerFactory.remoteReleases).to.equal(undefined);
    });

    it('should create overriden public properties on construction', () => {
      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
      let installerFactory = new InstallerFactory({
        appDirectory: 'correctDir',
        outputDirectory: 'custom/output/path',
        loadingGif: 'custom/gif/path',
        authors: 'custom author',
        owners: 'custom owner',
        exe: 'custom exe',
        iconUrl: 'custom icon url',
        description: 'custom description',
        version: '1234',
        title: 'custom title',
        certificateFile: 'custom certificateFile',
        certificatePassword: 'custom certificatePassword',
        signWithParams: 'custom signWithParams',
        setupIcon: 'custom setupIcon',
        remoteReleases: 'custom remoteReleases'
      });

      expect(getPackageJsonStub.calledWith('correctDir')).to.equal(true);
      expect(installerFactory.appDirectory).to.equal('correctDir');
      expect(installerFactory.outputDirectory).to.equal(path.resolve('custom', 'output', 'path'));
      expect(installerFactory.loadingGif).to.equal(path.resolve('custom', 'gif', 'path'));
      expect(installerFactory.authors).to.equal('custom author');
      expect(installerFactory.owners).to.equal('custom owner');
      expect(installerFactory.name).to.equal('some name');
      expect(installerFactory.exe).to.equal('custom exe');
      expect(installerFactory.iconUrl).to.equal('custom icon url');
      expect(installerFactory.description).to.equal('custom description');
      expect(installerFactory.version).to.equal('1234');
      expect(installerFactory.productName).to.equal('some product name');
      expect(installerFactory.title).to.equal('custom title');
      expect(installerFactory.certificateFile).to.equal('custom certificateFile');
      expect(installerFactory.certificatePassword).to.equal('custom certificatePassword');
      expect(installerFactory.signWithParams).to.equal('custom signWithParams');
      expect(installerFactory.setupIcon).to.equal('custom setupIcon');
      expect(installerFactory.remoteReleases).to.equal('custom remoteReleases');
    });
  });

  describe('syncReleases', () => {
    let getPackageJsonStub, execStub;

    beforeEach(() => {
      getPackageJsonStub = sinon.stub(Util, 'getPackageJson');
      execStub = sinon.stub(Util, 'exec');

      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
    });

    afterEach(() => {
      Util.getPackageJson.restore();
      Util.exec.restore();
    });

    it('should return a resolved promise if remoteReleases is not set', (done) => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir'});
      var promise = installerFactory.syncReleases();
      promise.then(() => {
        expect(true).to.equal(true);
        done();
      });
    });

    it('should successfully call exec', (done) => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      execStub.returns(Promise.resolve());
      var promise = installerFactory.syncReleases();
      promise.then(() => {
        expect(execStub.calledWith(path.resolve('vendor', 'SyncReleases.exe'), ['-u', installerFactory.remoteReleases, '-r', installerFactory.outputDirectory])).to.equal(true);
        done();
      });
    });

    it('should fail on call exec', (done) => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      execStub.returns(Promise.reject());
      var promise = installerFactory.syncReleases();
      promise.catch(() => {
        expect(execStub.calledWith(path.resolve('vendor', 'SyncReleases.exe'), ['-u', installerFactory.remoteReleases, '-r', installerFactory.outputDirectory])).to.equal(true);
        done();
      });
    });
  });

  describe('update', () => {
    let getPackageJsonStub, execStub;

    beforeEach(() => {
      getPackageJsonStub = sinon.stub(Util, 'getPackageJson');
      execStub = sinon.stub(Util, 'exec');

      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
    });

    afterEach(() => {
      Util.getPackageJson.restore();
      Util.exec.restore();
    });

    it('should return successfully on proper exec call', () => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir'});
      execStub.returns(Promise.resolve());
      var promise = installerFactory.update('some output');
      promise.then(() => expect(execStub.calledWith(path.resolve('vendor', 'Update.com'), [
        '--releasify',
        path.join('some output', `${installerFactory.name}.${installerFactory.version}.nupkg`),
        '--releaseDir',
        installerFactory.outputDirectory,
        '--loadingGif',
        installerFactory.loadingGif
      ])).to.equal(true));
    });

    it('should fail on improper exec call', () => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir'});
      execStub.returns(Promise.reject());
      var promise = installerFactory.update('some output');
      promise.catch(() => expect(execStub.calledWith(path.resolve('vendor', 'Update.com'), [
        '--releasify',
        path.join('some output', `${installerFactory.name}.${installerFactory.version}.nupkg`),
        '--releaseDir',
        installerFactory.outputDirectory,
        '--loadingGif',
        installerFactory.loadingGif
      ])).to.equal(true));
    });

    it('should resolve with signing params', () => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', signWithParams: 'some params'});
      execStub.returns(Promise.resolve());
      var promise = installerFactory.update('some output');
      promise.catch(() => expect(execStub.calledWith(path.resolve('vendor', 'Update.com'), [
        '--releasify',
        path.join('some output', `${installerFactory.name}.${installerFactory.version}.nupkg`),
        '--releaseDir',
        installerFactory.outputDirectory,
        '--loadingGif',
        installerFactory.loadingGif,
        '--signWithParams',
        'some params'
      ])).to.equal(true));
    });

    it('should resolve with certificate params', () => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', certificateFile: 'some certificateFile', certificatePassword: 'some certificatePassword'});
      execStub.returns(Promise.resolve());
      var promise = installerFactory.update('some output');
      promise.catch(() => expect(execStub.calledWith(path.resolve('vendor', 'Update.com'), [
        '--releasify',
        path.join('some output', `${installerFactory.name}.${installerFactory.version}.nupkg`),
        '--releaseDir',
        installerFactory.outputDirectory,
        '--loadingGif',
        installerFactory.loadingGif,
        '--signWithParams',
        `/a /f \"${path.resolve(installerFactory.certificateFile)}\" /p \"${installerFactory.certificatePassword}\"`
      ])).to.equal(true));
    });

    it('should resolve with setup icon params', () => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', setupIcon: 'some setupIcon'});
      execStub.returns(Promise.resolve());
      var promise = installerFactory.update('some output');
      promise.catch(() => expect(execStub.calledWith(path.resolve('vendor', 'Update.com'), [
        '--releasify',
        path.join('some output', `${installerFactory.name}.${installerFactory.version}.nupkg`),
        '--releaseDir',
        installerFactory.outputDirectory,
        '--loadingGif',
        installerFactory.loadingGif,
        '--setupIcon',
        path.resolve(installerFactory.setupIcon)
      ])).to.equal(true));
    });
  });

  describe('updateSetupFile', () => {
    let getPackageJsonStub, renameSyncStub;

    beforeEach(() => {
      getPackageJsonStub = sinon.stub(Util, 'getPackageJson');
      renameSyncStub = sinon.stub(fs, 'renameSync');
    });

    afterEach(() => {
      Util.getPackageJson.restore();
      fs.renameSync.restore();
    });

    it('should resolve with renaming the file using name if no product name is provieded', (done) => {
      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: undefined});
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      let promise = installerFactory.updateSetupFile();
      promise.then(() => {
        expect(renameSyncStub.calledWith(path.join(installerFactory.outputDirectory, 'Setup.exe'), path.join(installerFactory.outputDirectory, `${installerFactory.productName}.exe`))).to.equal(true);
        done();
      });
    });

    it('should resolve with renaming the file if product name is provieded', (done) => {
      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      let promise = installerFactory.updateSetupFile();
      promise.then(() => {
        expect(renameSyncStub.calledWith(path.join(installerFactory.outputDirectory, 'Setup.exe'), path.join(installerFactory.outputDirectory, `${installerFactory.productName}.exe`))).to.equal(true);
        done();
      });
    });
  });

  describe('createInstaller', () => {
    let getPackageJsonStub, execStub, trackStub, copySyncStub, templateStub, mkdirSyncStub, writeFileSyncStub;

    beforeEach(() => {
      getPackageJsonStub = sinon.stub(Util, 'getPackageJson');
      trackStub = sinon.stub(temp, 'track');
      copySyncStub = sinon.stub(fs, 'copySync');
      templateStub = sinon.stub(dot, 'template');
      mkdirSyncStub = sinon.stub(temp, 'mkdirSync');
      writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
      execStub = sinon.stub(Util, 'exec');

      getPackageJsonStub.returns({author: 'some author', name: 'some name', version: '123', description: 'some desc', productName: 'some product name'});
      templateStub.returns(() => 'some string');
      mkdirSyncStub.returns('some/path');
    });

    afterEach(() => {
      Util.getPackageJson.restore();
      temp.track.restore();
      fs.copySync.restore();
      dot.template.restore();
      temp.mkdirSync.restore();
      fs.writeFileSync.restore();
      Util.exec.restore();
    });

    it('should call exec', (done) => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      execStub.returns(Promise.resolve());
      let syncReleasesStub = sinon.stub(installerFactory, 'syncReleases').returns(Promise.resolve());
      let updateStub = sinon.stub(installerFactory, 'update').returns(Promise.resolve());
      let updateSetupFileStub = sinon.stub(installerFactory, 'updateSetupFile').returns(Promise.resolve());
      var promise = installerFactory.createInstaller();
      promise.then(() => {
        expect(trackStub.called).to.equal(true);
        expect(copySyncStub.called).to.equal(true);
        expect(templateStub.called).to.equal(true);
        expect(mkdirSyncStub.called).to.equal(true);
        expect(writeFileSyncStub.called).to.equal(true);
        expect(syncReleasesStub.called).to.equal(true);
        expect(updateStub.called).to.equal(true);
        expect(updateSetupFileStub.called).to.equal(true);
        done();
      });
    });

it('should call exec', (done) => {
      let installerFactory = new InstallerFactory({appDirectory: 'correctDir', remoteReleases: 'someUrl'});
      execStub.returns(Promise.resolve());
      let syncReleasesStub = sinon.stub(installerFactory, 'syncReleases').returns(Promise.reject());
      let updateStub = sinon.stub(installerFactory, 'update');
      let updateSetupFileStub = sinon.stub(installerFactory, 'updateSetupFile');
      var promise = installerFactory.createInstaller();
      promise.catch(() => {
        expect(trackStub.called).to.equal(true);
        expect(copySyncStub.called).to.equal(true);
        expect(templateStub.called).to.equal(true);
        expect(mkdirSyncStub.called).to.equal(true);
        expect(writeFileSyncStub.called).to.equal(true);
        expect(syncReleasesStub.called).to.equal(true);
        expect(updateStub.called).to.equal(false);
        expect(updateSetupFileStub.called).to.equal(false);
        done();
      });
    });
  });
});
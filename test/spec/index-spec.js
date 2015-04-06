/*global describe it expect beforeEach*/
'use strict';

import path from 'path';
import fs from 'fs-promise';

import temp from 'temp';

import index from '../../src/index';

describe('InstallerFactory', () => {
  beforeEach(() => {
    const updateExePath = path.join('atom-shell', 'app', 'Update.exe');
    if(fs.existsSync(updateExePath)) {
      fs.unlinkSync(updateExePath);
    }
  });

  it('should create new installer for the example app', (done) => {
    let outputDirectory = temp.mkdirSync('grunt-atom-shell-installer-');

    let promise = index({
      appDirectory: path.join('test', 'spec', 'atom-shell'),
      outputDirectory: outputDirectory,
      exe: 'atom.exe'
    });

    promise
      .then(() => {
        expect(fs.existsSync(path.join(outputDirectory, 'myapp-1.0.0-full.nupkg'))).to.equal(true);
        expect(fs.existsSync(path.join(outputDirectory, 'MyAppSetup.exe'))).to.equal(true);
        expect(fs.existsSync(path.join(__dirname, 'atom-shell', 'Update.exe'))).to.equal(true);
        done();
      })
      .catch(error => {
        console.log('error happened');
        console.log(error.stack);
        console.log(error);
      });
  });
});
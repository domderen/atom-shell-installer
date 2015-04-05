'use strict';

import ChildProcess from 'child_process';
import path from 'path';

import Promise from 'bluebird';
import jf from 'jsonfile';
import asar from 'asar';

export default {
	isEmpty(str) {
    return (!str || str.length === 0);
	},
  exec(cmd, args, options) {
    return new Promise((resolve, reject) => {
      ChildProcess.execFile(cmd, args, options, (error, stdout, stderr) => {
        if(error) {
          reject(`Command returned non-zero code ${error} with error output ${stderr}`);
        } else {
          resolve(stdout);
        }
      });
    });
  },
  getPackageJson(appDirectory) {
    try {
      return jf.readFileSync(path.resolve(appDirectory, 'resources', 'app', 'package.json'));
    } catch (error) {
      try {
        return JSON.parse(asar.extractFile(path.resolve(appDirectory, 'resources', 'app.asar'), 'package.json'));
      } catch (error) {
        throw new Error('Neither resources/app folder nor resources/app.asar package were found.');
      }
    }
  }
}
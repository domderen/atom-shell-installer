'use strict';

import Promise from 'bluebird';

import InstallerFactory from './InstallerFactory';

export default opts => {
  try {
    let installerFactory = new InstallerFactory(opts);
    return installerFactory.createInstaller();
  } catch (error) {
    return Promise.reject(error);
  }
}


var Promise = require('bluebird');
var supportedOS = ['win', 'osx', 'linux'];

function validateProject(params) {
  return new Promise(function(resolve, reject) {
    var projectName = params.projectName;
    if (!projectName) {
      res.badRequest('Field "projectName" is missing');
    }
    Project.findOne({name: projectName})
      .then(function(found) {
        if (!found) {
          reject('Project "' + projectName + '" not found');
        } else {
          params.project = found;
          resolve(params);
        }
      })
      .catch(function(error) {
        reject('Project "' + projectName + '" not found');
      })
      .done();
  });
}

function validateVersion(params) {
  return new Promise(function(resolve, reject) {
    var versionNumber = params.version;
    var type = params.type;
    var project = params.project;
    if (!versionNumber) {
      return reject('Field "version" is missing');
    }
    if (!type) {
      return reject('Field "type" is missing');
    }
    var versionParts = versionNumber.split('.');
    if (versionParts.length !== 4) {
      return reject('Version schema must be *.*.*.*');
    }
    if (type !== 'test' && type !== 'release') {
      return reject('Type must be "test" or "release"');
    }

    params.version = {
      type: type,
      number: versionNumber,
      project: project.id,
      builds: []
    };

    resolve(params);
  });
}

function generateBuilds(params) {
  return new Promise(function(resolve, reject) {
    var oss = params.oss;
    var hasPatch = params.hasPatch !== false ? true : false;

    var versionNumber = params.version.number.replace(/\./g, '_');

    if (!oss) {
      return reject('Field array "oss" is missing');
    }

    oss.forEach(function(os) {
      if (supportedOS.indexOf(os) === -1) {
        return reject(os + ' is not supported');
      }
    });

    oss.forEach(function(os) {
      var fullPath = versionNumber + '/' + os + '/full.zip';
      var patchPath = versionNumber + '/' + os + '/patch.zip';
      params.version.builds.push({
        os: os,
        bucket: params.version.type + params.project.name.toLowerCase(),
        fullURL:  fullPath,
        patchURL: hasPatch ? patchPath : fullPath
      });
    });

    resolve(params);
  });
}

function createVersion(params) {
  return Version.create(params.version);
}

module.exports = {
  attributes: {
    number: {
      required: true,
      type: 'string'
    },
    project: {
      required: true,
      model: 'project'
    },
    type: {
      required: true,
      type: 'string',
      enum: ['release', 'test']
    },
    builds: {
      collection: 'build',
      via: 'version'
    },
    getSimplified: function() {
      var builds = [];
      this.builds.forEach(function(build) {
        builds.push(build.getSimplified());
      });
      return {
        number: this.number,
        builds: builds
      };
    }
  },
  deploy: function(params) {
    return validateProject(params)
      .then(validateVersion)
      .then(generateBuilds)
      .then(createVersion);
  },
  getByNumberAndType: function(number, type, project) {
    return Version.findOne({
      where: {
        number: number,
        type: type,
        project: project.id
      }
    });
  },
  getAfterNumberAndByType: function(createdAt, type, count, project) {
    return Version.find({
      where: {
        createdAt: {'>': createdAt},
        type: type,
        project: project.id
      },
      sort: 'createdAt ASC',
      limit: count
    });
  },
  getAfter: function(params) {
    var that = this;
    //return new Promise(function(resolve, reject) {
    var type = params.type;
    var number = params.number;
    var count = params.count || 10;
    var project = params.project;
    //Get the current version
    return that.getByNumberAndType(number, type, project)
    //Get all the versions after current version
    .then(function(version) {
      return new Promise(function(resolve, reject) {
        if (!version) {
          console.log('Versions with number "' + number + '" not found');
          resolve(null);
        } else {
          resolve(that
            .getAfterNumberAndByType(version.createdAt, type, count, project)
            .populate('builds'));
        }
      });
    })
    //Simplify them
    .then(function(versions) {
      return new Promise(function(resolve, reject) {
        params.versions = [];
        if (versions) {
          versions.forEach(function(version) {
            params.versions.push(version.getSimplified());
          });
        }
        resolve(params);
      });
    });
    //.done();
    //});
  },
  getLatest: function(params) {
    return Version.find({
      sort: 'createdAt DESC',
      project: params.project.id,
      limit: 1
    })
    .populate('builds')
    .then(function(versions) {
      return new Promise(function(resolve, reject) {
        params.latest = versions[0].getSimplified();
        resolve(params);
      });
    });
  }
};

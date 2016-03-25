module.exports = {
  deploy: function(req, res) {
    Version.deploy({
      projectName: req.body.projectName,
      version: req.body.version,
      type: req.body.type,
      oss: req.body.oss,
      hasPatch: req.body.hasPatch
    })
    .then(function(params) {
      res.ok();
    })
    .catch(function(error) {
      console.error(error);
      res.badRequest({error: error});
    })
    .done();
  },
  getAfter: function(req, res) {
    var projectName = req.param('projectName', null);
    if (!projectName) {
      return res.badRequest({error: 'Field "projectName" not found'});
    }

    var versioNumber = req.param('versionNumber', null);
    if (!versioNumber) {
      return res.badRequest({error: 'Field "versionNumber" not found'});
    }

    Project.findOne({name: projectName})
      .then(function(project) {
        return Version.getAfter({
          type: req.param('type', 'release'),
          number: versioNumber,
          count: req.param('count', 10),
          project: project
        });
      })
      .then(Version.getLatest)
      .then(function(params) {
        res.ok({
          project: params.project.name,
          versions: params.versions,
          latest: params.latest
        });
      })
      .catch(function(error) {
        console.error(error);
        res.badRequest(error);
      })
      .done();
  }
};

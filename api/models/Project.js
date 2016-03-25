module.exports = {
  attributes: {
    name: {
      required: true,
      type: 'string'
    },
    description: {
      type: 'string'
    },
    versions: {
      collection: 'version',
      via: 'project'
    }
  }
};

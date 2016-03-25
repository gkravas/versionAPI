var sig = require('amazon-s3-url-signer');

var publicAccount = sig.urlSigner('AKIAII7FRGD6BGMAAGUQ',
                  'GLrjlU0+xFH4m2MVMdJIJdgpITyYZE+aqXfNB17U',
                  {useSubdomain: true});

function generateSignedUrl(bucket, path) {
  return publicAccount.getUrl('GET', path, bucket, 60 * 12); //url expires in 1/2 day
}

module.exports = {
  attributes: {
    version: {
      required: true,
      model: 'version'
    },
    os: {
      required: true,
      type: 'string',
      enum: ['win', 'osx', 'linux']
    },
    fullURL: {
      required: true,
      type: 'string'
    },
    patchURL: {
      required: true,
      type: 'string'
    },
    bucket: {
      required: true,
      type: 'string'
    },
    getSimplified: function() {
      return {
        os: this.os,
        fullURL: generateSignedUrl(this.bucket, this.fullURL),
        patchURL: generateSignedUrl(this.bucket, this.patchURL)
      };
    }
  }
};

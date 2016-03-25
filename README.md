# VersionAPI


A simple API(based on sails.js) for uploading any project information about versions and builds. It can be used from clients to know from where to download patches or full binaries, for each version and each build.

Sails policies are being utilized. To deploy a build from your build machine alter the isBuildMachine policy. Right now build machine's
detection is based on IP address.

Accessing API read only is open to anyone.

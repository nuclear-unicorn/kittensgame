var fs = require('fs');
var FILE_NAME = "build.version.json";

console.log('Incrementing build number...');
fs.readFile(FILE_NAME,function(err,content) {
    if (err) throw err;
    var metadata = JSON.parse(content);
    metadata.buildRevision = metadata.buildRevision + 1;
    fs.writeFile(FILE_NAME,JSON.stringify(metadata),function(err){
        if (err) throw err;
        console.log(`Current build number: ${metadata.buildRevision}`);
    })
});
var fs = require("fs"),
    sys = require("util");

/**
 * FileStreamReader
 *
 * Simple synchronuous stream reader for iterating over a file line by line.
 * exposes two iterator-like methods, hasNext() and next().
 *
 */
exports.FileStreamReader = function(filename, bufferSize) {

    if(!bufferSize) {
        bufferSize = 8192;
    }

    //private:
    var currentPositionInFile = 0;
    var buffer = "";
    var fd = fs.openSync(filename, "r");


    // return -1
    // when EOF reached
    // fills buffer with next 8192 or less bytes
    var fillBuffer = function(position) {

        var res = fs.readSync(fd, bufferSize, position, "ascii");

        buffer += res[0];
        if (res[1] == 0) {
            return -1;
        }
        return position + res[1];

    };

    currentPositionInFile = fillBuffer(0);

    //public:
    this.hasNext = function() {
        while (buffer.indexOf("\n") == -1) {
            currentPositionInFile = fillBuffer(currentPositionInFile);
            if (currentPositionInFile == -1) {
                return false;
            }
        }

        if (buffer.indexOf("\n") > -1) {

            return true;
        }
        return false;
    };

    //public:
    this.next = function() {
        var lineEnd = buffer.indexOf("\n");
        var result = buffer.substring(0, lineEnd);

        buffer = buffer.substring(result.length + 1, buffer.length);
        return result;
    };

    return this;
};



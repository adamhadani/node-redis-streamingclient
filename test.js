var stream_reader = require("./stream_reader"),
    rsc = require("./redis_streamingclient");

/**
 * Mock implementation of a redis client for unit-testing
 * and debugging.
 */
MOCK_ID = 0;
function RedisMockClient(port, host, opts) {
    this.id = MOCK_ID++;

    this.on = function(ev, callback) {
        var id = this.id;
        console.log("RedisMockClient[" + id + "]::on(" + ev + ") Called");
        if (callback) callback();
    }

    this.incr = function(args, callback) {
        var id = this.id;
        console.log("RedisMockClient[" + id + "]::incr(" + args + ") Called");
        if (callback) callback();
    }


    this.quit = function(callback) {
        var id = this.id;
        console.log("RedisMockClient[" + id + "]::quit() Called");
        if (callback) callback();
    }
}

// Test functionality
stream_reader = new stream_reader.FileStreamReader("test.txt");
key_func = function(line) { return line.split(" ")[0]; }
val_func = function(line) { return line.split(" ")[1]; }
client_factory = function(port, host, opts) {
    return new RedisMockClient(port, host, opts);
};

test = new rsc.RedisStreamingClient(stream_reader, key_func, val_func, {
    command: "incr", num_clients: 10, client_options: {}, 
    host: 'localhost', port: 8093 }, client_factory);

test.run(function() {
    console.log("All done!");
});

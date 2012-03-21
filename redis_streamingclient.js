var redis = require("redis"),
    stream_reader = require("./stream_reader");

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

/**
 * RedisStreamingClient
 * 
 * A class wrapper for implementing the
 * parallel redis request stream
 */
function RedisStreamingClient(stream_reader, key_func, val_func, args) {
    this.stream_reader = stream_reader;

    this.key_func = key_func;
    this.val_func = val_func;
    this.args = args;
    this.max_pipeline = 5; 
    this.clients = [];
    this.callback = null;

    this.clients_ready = 0;
    this.commands_sent = 0;
    this.commands_completed = 0;
    this.kill_flag = null;
}

RedisStreamingClient.prototype.run = function(callback) {
    var self = this;
    
    this.callback = callback;

    for (i=0; i < this.args.num_clients; i++) {
        var client = 
            new RedisMockClient(this.args.port, this.args.host, this.args.client_options);
            //redis.createClient(port, host, this.args.client_options);
        client.create_time = Date.now();

        this.clients[this.clients.length] = client;

        client.on("connect", function() {

        });
        client.on("ready", function() {
            self.clients_ready++;
            if (self.clients_ready == self.args.num_clients) {
                // All clients ready, can start work
                self.on_clients_ready();
            }
        });

    }
}

RedisStreamingClient.prototype.on_clients_ready = function() {
    // Fill up request pipeline initially
    this.fill_pipeline();
}

RedisStreamingClient.prototype.fill_pipeline = function() {
    var num_active = this.commands_sent - this.commands_completed;

    console.log("fill_pipeline(): num_active = " + num_active);
    while (this.kill_flag == null && num_active < this.max_pipeline) {
        this.send_next();
    }

    if (this.kill_flag) {
        this.kill_clients();
        this.kill_flag = false;
    }
}

RedisStreamingClient.prototype.send_next = function() {
    var self = this,
        curr_client = this.commands_sent % this.clients.length,
        start = Date.now();

    var line = self.stream_reader.next();
    
    if ( !line ) return;

    var key = this.key_func(line),
        value = this.val_func(line),
        args = [key, value];

    // Issue command, iterating over clients in sequence, and filling
    // command pipeline after each completion
    this.commands_sent++;
    this.clients[curr_client][this.args.command](args, function(err, res) {
        if (err) {
            throw err;
        }

        self.commands_completed++;
        
        if ( !self.stream_reader.hasNext() ) {
            // Reached EOF, raise kill flag
            self.kill_flag = true;
            return;
        }

        self.fill_pipeline();
    });
}

RedisStreamingClient.prototype.kill_clients = function() {
    var self = this;

    this.clients.forEach(function (client, pos) {
        if (pos == self.clients.length-1) {
            client.quit(function (err, res) {
                if (self.callback) self.callback();
            });
        } else {
            client.quit();
        }
    });
}



// Test functionality
stream_reader = new stream_reader.FileStreamReader("test.txt");
key_func = function(line) { return line.split(" ")[0]; }
val_func = function(line) { return line.split(" ")[1]; }

test = new RedisStreamingClient(stream_reader, key_func, val_func, {
    command: "incr", num_clients: 10, client_options: {}, 
    host: 'localhost', port: 8093 });

test.run(function() {
    console.log("All done!");
});

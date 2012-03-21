# node-redis-streamingclient

### A Node.js based Redis client that allows for high throughput indexing from arbitrary stream (e.g file)

This tool is inspired by an example provided by the [node_redis](https://github.com/mranney/node_redis) package.

## Usage

Example usage:

```node
stream_reader = new stream_reader.FileStreamReader("test.txt");
key_func = function(line) { return line.split(" ")[0]; }
val_func = function(line) { return line.split(" ")[1]; }

test = new RedisStreamingClient(stream_reader, key_func, val_func, {
    command: "incr", num_clients: 10, client_options: {},
    host: 'localhost', port: 8093 });

test.run(function() {
    console.log("All done!");
});
```


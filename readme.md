# reddit-event
Get new posts of reddit with a event

[![itworkwhy](https://forthebadge.com/images/badges/it-works-why.svg)](https://www.npmjs.com/package/reddit-event)

## Installation
```console
$ npm i reddit-event
```

## Usage

```js
const Reddit = require('reddit-event');
const reddit = new Reddit();
```

### .setLogging(boolean)
Logs when the package is looking through the subreddits, default: false | **Returns:** RedditClient </br></br>

### .setMinutes(number)
Sets the number of minutes to look for new posts, default: 1 | **Returns:** Promise\<RedditClient> </br></br>

### .sub.add(string)
Adds a subreddit to be watched | **Returns:** Promise\<RedditClient> </br></br>

### .sub.bulk.add(Array\<string>)
Adds multiple subreddits to be watched | **Returns:** Promise\<object> </br></br>

### .sub.remove(string)
Removes a subreddit from being watched | **Returns:** Promise\<RedditClient> </br></br>

### .sub.bulk.remove(Array\<string>)
Removes multiple subreddits to be watched | **Returns:** Promise\<object> </br></br>

### .sub.list()
Lists all subreddits you have being watched | **Returns:** Array\<string> </br></br>

### .on(event, callback)
Listen an event | **Returns:** RedditClient </br></br>

### .start()
This starts the operation to look for new posts | **Returns:** Promise\<void> </br></br>

## Events

### ready
Is emitted once the start function is called. | **Callback:** void </br></br>

### error
Is emitted once the package has an error | **Callback:** string </br></br>

### post
Is emitted once new posts from that subreddit is "new" | **Callback:** (string, Array) </br></br>
const { get } = require("axios").default;
const pkg = require("./package.json");
const ws = require("ws");
const error = (w, e) => w.emit("error", new Error(e));
let date = Math.floor(Date.now() / 1000);

const fetchSub = async (sub, log = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await get(`https://reddit.com/r/${sub}/new.json?limit=3`);
      if (res.status === 200) {
        let posts = [];
        for await (const post of res.data.data.children.reverse()) {
          if (date <= post.data.created_utc) {
            date = post.data.created_utc;
            let p = post.data;
            posts.push({
              id: p.id || null,
              title: p.title || "",
              url: p.url || "",
              permalink: `https://reddit.com${p.permalink}`,
              nsfw: p.over_18 || false,
              author: {
                name: p.author || "[deleted]",
                premium: p.author_premium || false,
                url: `https://reddit.com/u/${p.author || "deleted"}`,
              },
              sub: {
                name: p.subreddit || sub,
                members: p.subreddit_subscribers || 0,
                url: `https://reddit.com/r/${p.subreddit || sub}`,
              },
              counts: {
                score: p.score || 0,
                ups: p.ups || 0,
                downs: p.downs || 0,
                awards: p.total_awards_received || 0,
                comments: p.num_comments || 0,
                cross_posts: p.num_crossposts || 0,
                views: p.view_count || 0,
              },
              images: {
                thumbnail: p.thumbnail || "",
                preview: p.preview || { images: [], enabled: false },
              },
              misc: {
                original: p.is_original_content || false,
                edited: p.edited || false,
                hidden: p.hidden || false,
                archived: p.archived || false,
                pinned: p.pinned || false,
                media_only: p.media_only || false,
                spoiler: p.spoiler || false,
                locked: p.locked || false,
                replies: p.send_replies || false,
                video: p.is_video || false,
              },
            });
          }
        }
        if (posts.length === 0) return resolve([]);
        ++date;
        return resolve(posts);
      }
    } catch (e) {
      if (log === true) console.log(`${pkg.name} | FETCH_ERROR\n`, e.stack);
      resolve([]);
    }
  });
};

module.exports = class RedditClient {
  constructor(config) {
    this.author = pkg.author || "";
    this.version = pkg.version;
    this.events = new ws.Server({ port: config.websocketPort ?? 1034 });
    this.time = config.checkTime || 1; // Check subreddits every ${this.time} minutes
    this.db = new Set();
    this.logging = config.logCheck || false;
    this.sub = {
      add: async (sub) => {
        if (!this.db.has(sub)) {
          this.db.add(sub);
        }
        return this;
      },
      remove: async (sub) => {
        if (this.db.has(sub)) {
          this.db.delete(sub);
        }
        return this;
      },
      bulk: {
        add: async (subs = []) => {
          let added = [],
            removed = [];
          if (subs.length === 0) {
            error(
              this.events,
              `${pkg.name} | You have not provided any subreddit to add`
            );
            return false;
          }
          for await (const sub of subs) {
            let res = await this.getSub(sub);
            if (!res) {
              removed.push(sub);
            } else {
              added.push(sub);
              this.db.add(sub);
            }
          }
          if (added.length === 0)
            return error(
              this.events,
              `${pkg.name} | The subreddits you provided is invalid/not found`
            );
          return {
            status: true,
            added: added,
            invalid: removed,
          };
        },
        remove: async (subs = []) => {
          let added = [],
            removed = [];
          if (subs.length === 0) {
            error(
              this.events,
              `${pkg.name} | You have not provided any subreddit to add`
            );
            return false;
          }
          for await (const sub of subs) {
            let res = await this.getSub(sub);
            if (!res) {
              removed.push(sub);
            } else {
              added.push(sub);
              this.db.delete(sub);
            }
          }
          if (added.length === 0)
            return error(
              this.events,
              `${pkg.name} | The subreddits you provided is invalid/not found`
            );
          return {
            status: true,
            added: added,
            invalid: removed,
          };
        },
      },
      list: () => {
        let res = [];
        this.db.forEach((d) => res.push(d));
        return res || [];
      },
    };
  }
  on(event, listener) {
    this.events.on(event, listener);
    return this.events;
  }
  async getSub(sub) {
    let res = await this.isValid(sub);
    if (res !== true) {
      error(this.events, new Error(`The subreddit "${sub}" is invalid`));
      return null;
    }
    return true;
  }
  async isValid(sub) {
    let res = await get(
      `https://reddit.com/r/${sub}/about.json`
    ).catch(() => {});

    if (!res) return false;
    if (res.status !== 200) return false;
    if (res.data.data.hasOwnProperty("children")) {
      if (res.data.data.children.length === 0) return false;
    }
    return true;
  }
  async start() {
    if (this.db.size === 0) {
      return error(this.events, "You didn't add any subreddits to watch!");
    }
    setInterval(async () => {
      if (this.logging === true) {
        console.log(`${pkg.name} | Running the subrredit check.`);
      }
      this.db.forEach(async (sub) => {
        if (sub) {
          let res = await fetchSub(sub, this.logging);
          if (res.length !== 0) {
            this.events.emit("post", sub, res);
          }
        }
      });
    }, this.time * 60000);
    this.events.emit("ready", null);
  }
};

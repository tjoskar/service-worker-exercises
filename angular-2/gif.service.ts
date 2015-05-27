import http from './http';

class GifService {
  url: string;

  constructor() {
    this.url = 'http://www.reddit.com/r/perfectloops/top.json?sort=top&t=week';
  }

  get() : Promise<Array<any>> {
    return http.get(this.url)
      .then(data => JSON.parse(data))
      .then(data => data.data.children)
      .then(data => this.extractUrls(data))
      .catch(console.error.bind(console));
  }

  extractUrls(posts: Array<any>) {
    return posts
      .filter(post => !post.data.over_18)
      .map(post => post.data.url)
      .filter(url => !!/gifv?$/.exec(url))
      .map(url => url.replace(/v$/,''));
  }

}

export {GifService};

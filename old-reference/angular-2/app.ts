import {Component, View, bootstrap, For} from 'angular2/angular2';
import {GifService} from './gif.service';

@Component({
  selector: 'my-app'
})
@View({
  templateUrl: 'gifs.html',
  directives: [For]
})
class MyApp {
  gifs: Array<string>;
  service: GifService;

  constructor() {
    this.service = new GifService();
    this.gifs = [];
    this.getGifs();
  }

  getGifs() {
    this.service.get()
      .then(gifs => {
        gifs.forEach(gif => {
          this.addGif(gif);
        });
        return gifs;
      });
  }

  addGif(url) {
    this.gifs.push(url);
  }

}

export default function() {
  bootstrap(MyApp);
}

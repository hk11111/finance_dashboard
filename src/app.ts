import { DataService } from './services/data-service';

export class App {
  static dependencies = [DataService];

  constructor(private dataService: DataService) {}
}

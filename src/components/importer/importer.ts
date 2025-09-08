import { DataService } from '../../services/data-service';
import { customElement } from 'aurelia';

@customElement('importer')
export class Importer {
  static dependencies = [DataService];
  file: File | null = null;
  source: string = 'hapoalim';

  constructor(private dataService: DataService) {}

  handleFile(event: Event) {
    const target = event.target as HTMLInputElement;
    this.file = target.files ? target.files[0] : null;
  }

  async import() {
    if (this.file) {
      await this.dataService.importFromFile(this.file, this.source);
      this.file = null;
    }
  }
}

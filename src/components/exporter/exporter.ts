import { DataService } from '../../services/data-service';
import { customElement } from 'aurelia';

@customElement('exporter')
export class Exporter {
  static dependencies = [DataService];
  file: File | null = null;

  constructor(private dataService: DataService) {}

  handleFile(event: Event) {
    const target = event.target as HTMLInputElement;
    this.file = target.files ? target.files[0] : null;
  }

  export() {
    this.dataService.exportToJson();
  }

  async import() {
    if (this.file) {
      await this.dataService.importFromJson(this.file);
      this.file = null;
    }
  }
}

import { DataService } from '../../services/data-service';
import { Chart } from 'chart.js/auto';
import { customElement } from 'aurelia';

@customElement('account-chart')
export class AccountChart {
  static dependencies = [DataService];
  canvas!: HTMLCanvasElement;
  chart!: Chart;

  constructor(private dataService: DataService) {}

  attached() {
    this.render();
  }

  private render() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const summary = this.summarize();
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(summary),
        datasets: [{
          label: 'Amount by Category',
          data: Object.values(summary)
        }]
      }
    });
  }

  private summarize() {
    const res: Record<string, number> = {};
    for (const t of this.dataService.transactions) {
      res[t.category] = (res[t.category] || 0) + t.amount;
    }
    return res;
  }
}

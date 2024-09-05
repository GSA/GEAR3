import { Component, Input } from '@angular/core';
import { ApiService } from '@services/apis/api.service';

@Component({
  selector: 'app-csv-download',
  templateUrl: './csv-download.component.html',
  styleUrl: './csv-download.component.css'
})
export class CsvDownloadComponent {
  constructor(private apiService: ApiService) { }

  @Input("getDownloadInputs") getDownloadInputs: () => { fileName: string, fields?: string[], data: any[] };

  download() {
    const { fileName, fields, data } = this.getDownloadInputs();
    this.apiService.downloadCsv(fileName, fields, data).subscribe(response => {
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
}

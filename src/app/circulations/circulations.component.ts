import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { url } from 'inspector';
import { Observable } from 'rxjs';
import { FILTER } from './filter';
import { CirculationsService } from './circulations.service';

const URL = 'https://opefrvh60-tmm-activeplanmng-dataaccess-tmstmm.apps.k8s.mova.indra.es/api/activeplanmng/circulation-info/search';

@Component({
  selector: 'app-circulations',
  templateUrl: './circulations.component.html',
  styleUrls: ['./circulations.component.css']
})
export class CirculationsComponent implements OnInit {

  circulations: any[] = [];

  constructor(private circulationsService: CirculationsService) {}

  ngOnInit(): void {
    this.circulationsService.getCirculations().subscribe(
      (response) => this.circulations = response.data
    );
  }


}

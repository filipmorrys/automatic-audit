import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CirculationsService } from './circulations.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

const URL = 'https://opefrvh60-tmm-activeplanmng-dataaccess-tmstmm.apps.k8s.mova.indra.es/api/activeplanmng/circulation-info/search';

@Component({
  selector: 'app-circulations',
  templateUrl: './circulations.component.html',
  styleUrls: ['./circulations.component.css']
})
export class CirculationsComponent implements OnInit {

  circulations: any[] = [];
  currMoment!: moment.Moment;

  constructor(private circulationsService: CirculationsService, private router: Router) { }

  ngOnInit(): void {
    this.currMoment = moment().utc().startOf('day');
    console.log('Día actual: ' + this.currMoment.valueOf());

    this.loadCirculations();

  }

  private loadCirculations() {
    this.circulationsService.getCirculations(this.currMoment.valueOf())
    .pipe(
      tap(r => console.log(r)) 
    )
    .subscribe(
      (response) => this.circulations = response.data
    );
  }

  currenDay(): string {
    return this.currMoment.format('DD/MM/YYYY');
  }

  previousDay(): void {
    this.currMoment.subtract(1, 'd');
    this.loadCirculations();
  }

  nextDay(): void {
    this.currMoment.add(1, 'd');
    this.loadCirculations();
  }

  format(milis: number) {
    return moment(milis).format('hh:mm:ss');
  }

  auditCirculation(circulationId: string) {
    console.log('Auditar circulacion', circulationId);
    this.router.navigate(['/auditor'], { queryParams: { 'circulationId': circulationId } });
  }

}

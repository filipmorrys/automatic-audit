import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { CirculationsService } from './circulations.service';
import { Router } from '@angular/router';
import { Observable, Subscription, debounceTime, fromEvent, tap } from 'rxjs';

const URL = 'https://opefrvh60-tmm-activeplanmng-dataaccess-tmstmm.apps.k8s.mova.indra.es/api/activeplanmng/circulation-info/search';

@Component({
  selector: 'app-circulations',
  templateUrl: './circulations.component.html',
  styleUrls: ['./circulations.component.css']
})
export class CirculationsComponent implements OnInit, AfterViewInit, OnDestroy {

  circulations: any[] = [];
  filteredCirculations: any[] = [];
  currMoment!: moment.Moment;
  @ViewChild('searcher') searcherElement: any; 
  searcher$!: Observable<string>;
  searcherSubscription!: Subscription;

  constructor(private circulationsService: CirculationsService, private router: Router) { }
  ngOnDestroy(): void {
    if (this.searcherSubscription) {
      this.searcherSubscription.unsubscribe();
    }
  }
  ngAfterViewInit(): void {
    console.log('searcherElement', this.searcherElement);
    this.searcher$ = fromEvent(this.searcherElement.nativeElement, 'keyup');
    this.searcher$.pipe(
      debounceTime(200)
    );
    this.searcherSubscription = this.searcher$.subscribe(ev => {
      this.filteredCirculations = this.circulations.filter(c => this.matchSearch(c))
    });
  }

  matchSearch(c: any): boolean {
    let value = this.searcherElement.nativeElement.value;
    return c.originNumber.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || c.originTczName.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || c.destinationTczName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
  }

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
      (response) => {
        this.circulations = response.data;
        this.filteredCirculations = this.circulations;
      }
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

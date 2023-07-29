import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TRACK_CIRCUITS } from './trackcircuits';
import { POSITION_MESSAGE } from './position.message';
import { AuditorService } from './auditor.service';
import { NODES } from './nodes';
import { TCZS } from './tczs';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, debounceTime, fromEvent } from 'rxjs';
import { TopologyService } from './topology.service';

@Component({
  selector: 'app-auditor',
  templateUrl: './auditor.component.html',
  styleUrls: ['./auditor.component.css']
})
export class AuditorComponent implements OnInit, AfterViewInit, OnDestroy {

  filteredTrackCircuits: any[] = [];
  circulationId: string = '';
  circulationName: string = 'N/A';
  positionMessage = POSITION_MESSAGE;
  message = '';
  @ViewChild('searcher') searcherElement: any;
  searcher$!: Observable<string>;
  searcherSubscription!: Subscription;


  @ViewChild("textMessage") textMessage!: ElementRef;

  constructor(private auditor: AuditorService, private topologyService: TopologyService, private activatedRoute: ActivatedRoute) { }

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
      this.filteredTrackCircuits = this.topologyService.trackCircuits.filter(tc => this.matchSearch(tc))
    });
  }

  matchSearch(tc: any): boolean {
    let value = this.searcherElement.nativeElement.value;
    return tc.topoEvent.trainDetectorMnemonic.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.tczName.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.nodeName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
  }

  /**
   * On Init
   */
  ngOnInit(): void {
    if (!this.topologyService.loaded) {
      this.topologyService.loadEmmiter.subscribe(
        ev => {
          if (ev === 'COMPLETED') {
            this.filteredTrackCircuits = this.topologyService.trackCircuits;
          }
        }
      );
      this.topologyService.loadTopology();
    } else {
      this.filteredTrackCircuits = this.topologyService.trackCircuits;
    }

    this.activatedRoute.queryParams.subscribe(params => {
      if (params['circulationId']) {
        this.circulationId = params['circulationId'];
      }
      if (params['circulationName']) {
        this.circulationName = params['circulationName'];
      }
    });

  }


  sendPosition(i: number) {
    let tc = this.filteredTrackCircuits[i];
    this.auditor.sendPosition(this.circulationId, tc.topoEvent.direction, tc.topoEvent.trainDetectorMnemonic);
  }

  setPosition(i: number) {
    let tc = this.filteredTrackCircuits[i];
    this.positionMessage.circulationId.id = this.circulationId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = tc.topoEvent.trainDetectorMnemonic;
    this.positionMessage.currentStatus.direction = (tc.topoEvent.direction === 'BOTH') ? 'EVEN' : tc.topoEvent.direction;

    this.message = JSON.stringify(this.positionMessage);
    this.copyMessage();
  }

  copyMessage() {
    console.log(this.textMessage);
    setTimeout(() => {
      this.textMessage.nativeElement.select();
      document.execCommand('copy');
      this.textMessage.nativeElement.setSelectionRange(0, 0);
    }, 100);

  }

}

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

  trackCircuits = TRACK_CIRCUITS;
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
      this.filteredTrackCircuits = this.trackCircuits.filter(tc => this.matchSearch(tc))
    });
  }

  matchSearch(tc: any): boolean {
    let value = this.searcherElement.nativeElement.value;
    return tc.trainDetectorMnemonic.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.tczName.toLowerCase().indexOf(value.toLowerCase()) >= 0
      || tc.nodeName.toLowerCase().indexOf(value.toLowerCase()) >= 0;
  }

  ngOnInit(): void {

    /*
    this.topologyService.loadEmmiter.subscribe(
      ev => {
        if (ev === 'COMPLETED') {
          this.filteredTrackCircuits = this.topologyService.trackCircuits;
        }
      }
    );
    */
    this.topologyService.loadTopology();

    this.activatedRoute.queryParams.subscribe(params => {
      if (params['circulationId']) {
        this.circulationId = params['circulationId'];
      }
      if (params['circulationName']) {
        this.circulationName = params['circulationName'];
      }
    });


    this.trackCircuits.forEach(tc => {
      /**
       * Completar la información del nodo
       */
      if (!tc.nodeMnemonic) {
        let node = NODES.find(n => {
          if (tc.tczMnemonic) {
            return n.tczList.includes(tc.tczMnemonic);
          }
          return false;
        });
        if (node) {
          tc.nodeMnemonic = node.mnemonic;
          tc.nodeName = node.name;
        }
      } else {
        let node = NODES.find(n => n.mnemonic === tc.nodeMnemonic);
        if (node) {
          tc.nodeName = node.name;
        }
      }

      /**
       * Completar la información del TCZ
       */
      if (tc.tczMnemonic) {
        let tcz = TCZS.find(t => t.mnemonic === tc.tczMnemonic);
        if (tcz) {
          tc.tczName = tcz.name;
        }
      }
    });
    this.trackCircuits.sort(compare);
    this.filteredTrackCircuits = this.trackCircuits;
  }


  sendPosition(i: number) {
    this.auditor.sendPosition(this.circulationId, "ODD", this.filteredTrackCircuits[i].trainDetectorMnemonic);
  }

  setPosition(i: number) {
    this.positionMessage.circulationId.id = this.circulationId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = this.filteredTrackCircuits[i].trainDetectorMnemonic;
    this.positionMessage.currentStatus.direction = (this.filteredTrackCircuits[i].direction === 'BOTH') ? 'EVEN' : this.filteredTrackCircuits[i].direction;

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

function compare(a: any, b: any) {
  if (a.nodeName > b.nodeName) {
    return -1;
  } else if (a.nodeName < b.nodeName) {
    return 1;
  } else {
    if (a.tczName > b.tczName) {
      return -1;
    } else {
      return 1;
    }
  }

}
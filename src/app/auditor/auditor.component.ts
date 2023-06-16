import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TRACK_CIRCUITS } from './trackcircuits';
import { POSITION_MESSAGE } from './position.message';
import { AuditorService } from './auditor.service';
import { NODES } from './nodes';
import { TCZS } from './tczs';

@Component({
  selector: 'app-auditor',
  templateUrl: './auditor.component.html',
  styleUrls: ['./auditor.component.css']
})
export class AuditorComponent implements OnInit{

  trackCircuits = TRACK_CIRCUITS;
  circulationId: string = '';
  positionMessage = POSITION_MESSAGE;
  message = '';
  @ViewChild("textMessage") textMessage!: ElementRef;

  constructor(private auditor: AuditorService) {}

  ngOnInit(): void {
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
  }


  sendPosition(i: number) {
    this.auditor.sendPosition(this.circulationId, "ODD", this.trackCircuits[i].mnemonic);
  }

  setPosition(i: number) {
    this.positionMessage.circulationId.id = this.circulationId;
    this.positionMessage.currentStatus.trainDetectors[0].trainDetectorId = this.trackCircuits[i].trainDetectorMnemonic;
    this.positionMessage.currentStatus.direction = (this.trackCircuits[i].direction === 'UNDEFINED') ? 'EVEN' : this.trackCircuits[i].direction;

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
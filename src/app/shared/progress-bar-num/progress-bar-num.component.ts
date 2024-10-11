import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { GameSettings } from 'src/app/GameSettings';

@Component({
  selector: 'app-progress-bar-num',
  templateUrl: './progress-bar-num.component.html',
  styleUrls: ['./progress-bar-num.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarNumComponent implements OnInit {
  @Input() text: Text;
  @Input() val: number;
  @Input() hp: number;

  constructor(public settings: GameSettings) { }

  ngOnInit() {
  }
}

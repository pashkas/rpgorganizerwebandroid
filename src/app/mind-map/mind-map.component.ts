import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PersService } from '../pers.service';
import { mapDicItem } from 'src/Models/mapDicItem';
import { MatBottomSheet, MatDialog } from '@angular/material';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { taskState } from 'src/Models/Task';
import { Location } from '@angular/common';
import { Characteristic } from 'src/Models/Characteristic';
import { Subject } from 'rxjs';
import { Pers } from 'src/Models/Pers';
import { takeUntil } from 'rxjs/operators';

declare const require: any;

function getModule(m: any): any {
  return m && m.default ? m.default : m;
}

const cytoscape = getModule(require('cytoscape'));
const dagre = getModule(require('cytoscape-dagre'));
let isDagreRegistered = false;

@Component({
  selector: 'app-mind-map',
  templateUrl: './mind-map.component.html',
  styleUrls: ['./mind-map.component.css']
})
export class MindMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mindMapCanvas', { static: false }) mindMapCanvas: ElementRef<HTMLDivElement>;

  private unsubscribe$ = new Subject();
  private cy: any;
  private isViewReady = false;

  contextmenu = false;
  date: any[] = [];
  dic: Map<string, mapDicItem>;
  id: any;
  idx: any;
  item: mapDicItem;
  links: any[] = [];
  pers: Pers;

  constructor(public srv: PersService, private location: Location, private _bottomSheet: MatBottomSheet, public dialog: MatDialog, private zone: NgZone) { }

  choose(n) {
    this.contextmenu = false;

    if (n == 'открыть') {
      switch (this.item.type) {
        case 't':
          this.srv.openTask(this.id);
          break;
        case 'ch':
          this.srv.openCharact(this.id);
          break;

        case 'pers':
          this.srv.openPers();
          break;

        default:
          break;
      }
    }
    else if (n == 'удалить') {
      switch (this.item.type) {
        case 't':
          this.srv.delAbil(this.item.el.id);
          break;
        case 'ch':
          this.srv.DeleteCharact(this.id);
          break;
      }

      this.srv.savePers(false);
    }
    else if ((n == 'добавить')) {
      this.srv.isDialogOpen = true;
      const dialogRef = this.dialog.open(AddItemDialogComponent, {
        panelClass: 'my-dialog',
        data: { header: 'Добавить', text: '' },
        backdropClass: 'backdrop'
      });

      dialogRef.afterClosed()
        .subscribe(name => {
          if (name) {
            switch (this.item.type) {
              case 'pers':
                // Навык напрямую
                if (this.pers.isNoAbs) {
                  let firstCharact: Characteristic;
                  if (this.pers.characteristics.length > 0) {
                    firstCharact = this.pers.characteristics[0];
                  }
                  // Навык к характеристике
                  else {
                    this.srv.addCharact('');
                    firstCharact = this.pers.characteristics[0];
                  }
                  this.srv.addAbil(firstCharact.id, name);
                }
                else {
                  this.srv.addCharact(name);
                }
                break;
              case 'ch':
                this.srv.addAbil(this.id, name);
                break;
              case 't':
                this.item.el.tasks[0].isSumStates = true;
                let state = new taskState();
                state.value = this.item.el.tasks[0].value;
                state.requrense = this.item.el.tasks[0].requrense;
                state.image = this.srv.GetRndEnamy(state, this.pers.level, this.pers.maxPersLevel);
                state.name = name;
                this.item.el.tasks[0].states.push(state);
                break;
            }

            this.srv.savePers(false);
          }
          this.srv.isDialogOpen = false;
        });
    }
  }

  goBack() {
    this.location.back();
  }

  getAbilityCount(): number {
    let count = 0;

    if (!this.pers || !this.pers.characteristics) {

      return count;
    }

    for (const ch of this.pers.characteristics || []) {
      count += ch.abilities ? ch.abilities.length : 0;
    }

    return count;
  }

  getCharactCount(): number {
    if (!this.pers || !this.pers.characteristics) {

      return 0;
    }

    return this.pers.characteristics.length;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.renderGraph();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (!this.cy) {

      return;
    }

    this.cy.resize();
    this.runLayout();
  }

  ngOnInit() {
    this.srv.pers$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(n => {
        this.pers = n;
        if (this.pers) {
          this.udateGraph();
        }
      });
  }

  private getShortNodeName(name: string): string {
    if (!name || name.length <= 22) {

      return name;
    }

    return name.substr(0, 20) + '...';
  }

  private getTaskColor(t): string {
    if (t.isDone) {

      return '#8ecae6';
    }

    if (t.mayUp) {

      return '#f4a261';
    }

    return '#cad8d5';
  }

  private getNodeLabel(name: string, subText: any = ''): string {
    let result = this.getShortNodeName(name);

    if (subText !== undefined && subText !== null && subText !== '') {
      result += '\n' + subText;
    }

    return result;
  }

  private getGraphStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'border-color': '#ffffff',
          'border-width': 2,
          'color': '#1f2d2f',
          'font-family': 'Roboto, Arial, sans-serif',
          'font-size': 12,
          'font-weight': 700,
          'height': 'data(height)',
          'label': 'data(label)',
          'line-height': 1.2,
          'overlay-opacity': 0,
          'shape': 'round-rectangle',
          'text-halign': 'center',
          'text-max-width': 112,
          'text-outline-color': 'data(color)',
          'text-outline-opacity': 0.28,
          'text-outline-width': 2,
          'text-valign': 'center',
          'text-wrap': 'wrap',
          'width': 'data(width)'
        }
      },
      {
        selector: 'node[type = "pers"]',
        style: {
          'border-color': '#f6d365',
          'border-width': 4,
          'font-size': 14,
          'height': 64,
          'text-max-width': 132,
          'width': 150
        }
      },
      {
        selector: 'node[type = "ch"]',
        style: {
          'height': 50,
          'width': 128
        }
      },
      {
        selector: 'node[type = "t"]',
        style: {
          'font-size': 11,
          'height': 'data(height)',
          'width': 'data(width)'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'line-color': 'data(color)',
          'line-style': 'solid',
          'opacity': 0.78,
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'none',
          'width': 2
        }
      },
      {
        selector: ':active',
        style: {
          'overlay-opacity': 0
        }
      },
      {
        selector: 'edge[linkType = "req"]',
        style: {
          'line-color': '#9b5de5',
          'line-style': 'dashed',
          'opacity': 0.72,
          'target-arrow-color': '#9b5de5',
          'target-arrow-shape': 'triangle',
          'width': 2
        }
      },
      {
        selector: ':selected',
        style: {
          'overlay-opacity': 0
        }
      }
    ];
  }

  private initCy() {
    if (!isDagreRegistered) {
      cytoscape.use(dagre);
      isDagreRegistered = true;
    }

    this.cy = cytoscape({
      autoungrabify: true,
      autounselectify: true,
      boxSelectionEnabled: false,
      container: this.mindMapCanvas.nativeElement,
      elements: [],
      hideEdgesOnViewport: true,
      maxZoom: 3,
      minZoom: 0.08,
      motionBlur: true,
      motionBlurOpacity: 0.2,
      style: this.getGraphStyle(),
      textureOnViewport: true,
      wheelSensitivity: 0.65
    });

    this.cy.on('tap', 'node', event => {
      this.zone.run(() => {
        const node = event.target;
        this.id = node.id();
        this.idx = node.data('index');
        this.item = this.dic.get(this.id);
        this.contextmenu = true;
      });
    });

    this.cy.on('tap', event => {
      if (event.target === this.cy) {
        this.zone.run(() => {
          this.contextmenu = false;
        });
      }
    });
  }

  private runLayout() {
    if (!this.cy) {

      return;
    }

    try {
      this.cy.layout({
        name: 'preset',
        animate: false,
        fit: true,
        padding: this.getLayoutPadding(),
        positions: node => this.getHierarchyPosition(node)
      }).run();
      this.cy.nodes().ungrabify();
      this.fitGraphToScreen();
    } catch (err) {
      console.warn('Карта персонажа: не удалось применить mindmap-раскладку', err);
      this.cy.layout({
        name: 'breadthfirst',
        directed: true,
        fit: true,
        padding: this.getLayoutPadding(),
        spacingFactor: 1.2
      }).run();
      this.cy.nodes().ungrabify();
      this.fitGraphToScreen();
    }
  }

  private getHierarchyPosition(node: any): any {
    const id = node.id();
    const data = node.data();

    if (id == 'pers') {

      return { x: 0, y: 0 };
    }

    if (!data || data.branchIndex == null) {

      return { x: 0, y: 0 };
    }

    if (this.isPhonePortrait()) {

      return this.getLeftToRightPosition(data);
    }

    return this.getTopToBottomPosition(data);
  }

  private getLeftToRightPosition(data: any): any {
    const taskColumns = 2;
    const branchTaskCount = this.getBranchTaskCount(data);
    const branchY = this.getBranchTop(data.branchIndex, taskColumns) - this.getGraphHeight(taskColumns) / 2;
    const taskRows = Math.max(1, Math.ceil(branchTaskCount / taskColumns));

    if (data.type == 'ch') {

      return {
        x: 235,
        y: branchY + (taskRows - 1) * 72 / 2
      };
    }

    if (data.type == 't') {
      const taskIndex = data.taskIndex || 0;
      const row = Math.floor(taskIndex / taskColumns);
      const column = taskIndex % taskColumns;

      return {
        x: 470 + column * 130,
        y: branchY + row * 72
      };
    }

    return { x: 0, y: 0 };
  }

  private getTopToBottomPosition(data: any): any {
    const taskColumns = 4;
    const taskCount = this.getBranchTaskCount(data);
    const taskIndex = data.taskIndex || 0;
    const branchWidth = this.getBranchWidth(taskCount, taskColumns);
    const branchX = this.getBranchLeft(data.branchIndex, taskColumns) - this.getGraphWidth(taskColumns) / 2;
    const branchCenter = branchX + branchWidth / 2;

    if (data.type == 'ch') {

      return {
        x: branchCenter,
        y: 175
      };
    }

    if (data.type == 't') {
      const row = Math.floor(taskIndex / taskColumns);
      const column = taskIndex % taskColumns;

      return {
        x: branchCenter + (column - (Math.min(taskCount, taskColumns) - 1) / 2) * 142,
        y: 300 + row * 76
      };
    }

    return { x: 0, y: 0 };
  }

  private getBranchTaskCounts(): number[] {
    if (!this.pers || !this.pers.characteristics) {

      return [1];
    }

    return (this.pers.characteristics || []).map(ch => {
      const count = (ch.abilities || []).reduce((total, ab) => total + ((ab.tasks || []).length), 0);

      return Math.max(count, 1);
    });
  }

  private getBranchTaskCount(data: any): number {
    const branchCounts = this.getBranchTaskCounts();

    return Math.max(data.taskCount || branchCounts[data.branchIndex] || 1, 1);
  }

  private getBranchTop(branchIndex: number, taskColumns: number): number {
    const counts = this.getBranchTaskCounts();
    let top = 0;

    for (let i = 0; i < branchIndex; i++) {
      top += this.getBranchHeight(counts[i], taskColumns) + this.getBranchGap();
    }

    return top;
  }

  private getGraphHeight(taskColumns: number): number {
    return this.getBranchTaskCounts()
      .reduce((height, count, index) => height + this.getBranchHeight(count, taskColumns) + (index > 0 ? this.getBranchGap() : 0), 0);
  }

  private getBranchHeight(taskCount: number, taskColumns: number): number {
    const rowCount = Math.max(1, Math.ceil(taskCount / taskColumns));

    return Math.max(80, rowCount * 72);
  }

  private getBranchGap(): number {
    return 96;
  }

  private getBranchLeft(branchIndex: number, taskColumns: number): number {
    const counts = this.getBranchTaskCounts();
    let left = 0;

    for (let i = 0; i < branchIndex; i++) {
      left += this.getBranchWidth(counts[i], taskColumns) + this.getHorizontalBranchGap();
    }

    return left;
  }

  private getGraphWidth(taskColumns: number): number {
    return this.getBranchTaskCounts()
      .reduce((width, count, index) => width + this.getBranchWidth(count, taskColumns) + (index > 0 ? this.getHorizontalBranchGap() : 0), 0);
  }

  private getBranchWidth(taskCount: number, taskColumns: number): number {
    const columnCount = Math.min(Math.max(taskCount, 1), taskColumns);

    return Math.max(260, columnCount * 142);
  }

  private getHorizontalBranchGap(): number {
    return 126;
  }

  private getLayoutPadding(): number {
    if (this.isPhonePortrait()) {

      return 22;
    }

    return 34;
  }

  private isPhonePortrait(): boolean {
    return window.innerWidth <= 575 && window.innerHeight > window.innerWidth;
  }

  private fitGraphToScreen() {
    if (!this.cy || this.cy.elements().length == 0) {

      return;
    }

    this.cy.resize();
    this.cy.fit(this.cy.elements(), this.getLayoutPadding());
    this.cy.center(this.cy.elements());
  }

  private getLinksToRender(): any[] {
    const nodeIds = new Set<string>(this.date.map(n => n.data.id));
    const linkIds = new Set<string>();

    return this.links.filter(l => {
      if (!l || !l.data || !l.data.source || !l.data.target) {

        return false;
      }

      if (!nodeIds.has(l.data.source) || !nodeIds.has(l.data.target) || linkIds.has(l.data.id)) {

        return false;
      }

      linkIds.add(l.data.id);

      return true;
    });
  }

  private renderGraph() {
    if (!this.isViewReady || !this.mindMapCanvas || !this.pers) {

      return;
    }

    if (!this.cy) {
      this.initCy();
    }

    try {
      this.cy.resize();
      this.cy.elements().remove();
      this.cy.add(this.date);
      this.cy.add(this.getLinksToRender());
      this.runLayout();
    } catch (err) {
      console.warn('Карта персонажа: не удалось отрисовать граф целиком', err);
      this.cy.elements().remove();
      this.cy.add(this.date);
      this.cy.layout({
        name: 'breadthfirst',
        fit: true,
        padding: 78,
        spacingFactor: 1.2
      }).run();
    }
  }

  private udateGraph() {
    this.dic = new Map<string, mapDicItem>();
    this.date = [];
    this.links = [];

    let idx = 0;
    const branchCount = Math.max((this.pers.characteristics || []).length, 1);
    let branchIndex = 0;
    this.dic.set('pers', new mapDicItem('pers', this.pers.name, idx, null));
    idx++;
    this.date.push({
      data: {
        id: 'pers',
        index: this.dic.get('pers').index,
        label: this.getNodeLabel(this.pers.name, 'уровень ' + this.pers.level),
        color: '#2a9d8f',
        type: 'pers'
      }
    });
    // Характеристики
    for (const ch of this.pers.characteristics || []) {
      if (!this.pers.isNoAbs) {
        this.dic.set(ch.id, new mapDicItem('ch', ch.name, idx, ch));
        idx++;
        this.date.push({
          data: {
            id: ch.id,
            index: this.dic.get(ch.id).index,
            label: this.getNodeLabel(ch.name, ch.rang ? 'ранг ' + ch.rang.name : ''),
            branchCount: branchCount,
            branchIndex: branchIndex,
            color: '#e9c46a',
            parentId: 'pers',
            type: 'ch'
          }
        });
        this.links.push({
          data: {
            id: 'pers-' + ch.id,
            source: 'pers',
            target: ch.id,
            color: 'rgba(42, 157, 143, 0.46)',
            linkType: 'main'
          }
        });
      }
      // Навыки
      const taskCount = (ch.abilities || []).reduce((count, ab) => count + ((ab.tasks || []).length), 0);
      let taskIndex = 0;
      for (const ab of ch.abilities || []) {
        // SumStates
        for (const t of ab.tasks || []) {
          this.dic.set(t.id, new mapDicItem('t', t.name, idx, ab));
          this.date.push({
            data: {
              id: t.id,
              index: this.dic.get(t.id).index,
              label: this.getNodeLabel(t.name, ab.rang ? 'ранг ' + ab.rang.name : ''),
              branchCount: branchCount,
              branchIndex: branchIndex,
              color: this.getTaskColor(t),
              height: t.mayUp ? 46 : 40,
              parentId: !this.pers.isNoAbs ? ch.id : 'pers',
              taskCount: taskCount,
              taskIndex: taskIndex,
              type: 't',
              width: t.mayUp ? 120 : 108
            }
          });
          idx++;
          taskIndex++;

          // Если в требованиях есть с такой же характеристикой, ссылку не делаем
          let haveSameCharact = false;
          for (const r of t.reqvirements || []) {
            for (const abs of ch.abilities || []) {
              for (const tscs of abs.tasks || []) {
                if (tscs.id == r.elId) {
                  haveSameCharact = true;
                }
              }
            }
          }

          if (!haveSameCharact) {
            this.links.push({
              data: {
                id: (!this.pers.isNoAbs ? ch.id : 'pers') + '-' + t.id,
                source: !this.pers.isNoAbs ? ch.id : 'pers',
                target: t.id,
                color: 'rgba(233, 196, 106, 0.54)',
                linkType: 'main'
              }
            });
          }
        }
      }
      branchIndex++;
    }
    // Требования
    for (const ch of this.pers.characteristics || []) {
      for (const ab of ch.abilities || []) {
        for (const t of ab.tasks || []) {
          for (const r of t.reqvirements || []) {
            if (this.dic.get(t.id) && this.dic.get(r.elId)) {
              this.links.push({
                data: {
                  id: r.elId + '-' + t.id + '-req',
                  source: r.elId,
                  target: t.id,
                  color: '#9b5de5',
                  linkType: 'req'
                }
              });
            }
          }
        }
      }
    }

    this.renderGraph();
  }
}

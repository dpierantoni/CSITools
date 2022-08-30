import { AfterViewInit, Component, OnInit, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import * as regression from 'regression';
import { max } from 'lodash';

import { NotificationService } from '../../services/notification.service'


interface IxyGraph {
  'x': number,
  'y': number
}

interface IplotlySplineGraph {
  x:number[],
  y:number[],
  type:string,
  name: string,
  mode:string,
  marker:{
    color:string,
    size:number
  }, 
  line:{
    dash:string,
    color:string,
    width:number
  }
}


@Component({
  selector: 'spline-creator',
  templateUrl: './spline-creator.component.html',
  styleUrls: ['./spline-creator.component.css']
})
export class SplineCreatorComponent implements OnInit {

  @Input() selectedTabIndex:number | undefined;
  
  ngOnChanges(): void {
    
    if (this.selectedTabIndex === 1) { 
      setTimeout(() => {
        this.clearSpringSplineData();
      }, 200);
    }
  }
  splineStart:number = 0;
  springSplineType:string = 'single';  //Options single & cut
  pasteBoxString:string = 'Click box and Paste Ride Rate Data Here (Ctrl + V)'
  displayedColumns: string[] = [];
  dataSource: any[] = [];
  
  springGraph = {
    data: [
      {
        x: [0],
        y: [0],
        type: 'scattergl',
        name: '',
        mode: 'lines+markers',
        marker: {
          color: 'blue',
          size: 2
        },
        line: {
          color: 'blue',
          width: 2
        }
      }
    ],
    layout: 
      {autosize: false, showlegend: true, legend: {x: .4, y: -.2, "orientation": "h"}, 
      title: 'Spring Travel vs Spring Load',
      xaxis: {title: 'Spring Travel (in)', zeroline: false, showline: true, range: [-1, 1]},
      yaxis: {title: 'Spring Load (lbf)', zeroline: false, showline: true},
      margin: {
        l: 70,
        r: 50,
        b: 50,
        t: 50,
        pad: 0
      },
    },
  }
  list:any[] = [];
  loadOffset:number = 0
  secondPointFit:number | undefined;
  setupSpringLoad:number = 0
  splineCut:number = 0;
  splineEnd:number = 0;
  rideRateOverride:IxyGraph[] = [];
  engagedSpline:IxyGraph[] = [];
  pastedSpringDataPersist:IxyGraph[] = [];
  pastedSpringDataOffset:IxyGraph[] = [];
  pastedSpringDataMod:IxyGraph[] = [];

  constructor(private clipboard: Clipboard, private notificationService: NotificationService) { }
    
  ngOnInit(): void {

  }

  public async findXMaxValue(data:IxyGraph[]) {
    let xValues: number[] = [];
    data.forEach((item) => {
      xValues.push(item.x);
    });
    let max:number = Math.ceil(Math.max(...xValues));
    return max
  }

  public async fitLinearSpringStart(data:IxyGraph[]){
    const regression = require('regression');
    let fullSpline:IxyGraph[] = [];
    let fitData:number[][] = [];
    let secondPointX:number = data[1].x;
    
    data.forEach((item) => {
      if (item.x < secondPointX + 1){
        if (item.y !== undefined && !isNaN(item.y)) {
          fitData.push([item.x, item.y]);
        }
      }
    });
    const result = regression.polynomial(fitData, { order: 2 });
    fullSpline.push(data[0]);
    let count:number = .05;
    
    for (let i = 0 ; i < data.length - 1 ; i++) {
      if (count < secondPointX) {
        let predictObj:number[] = result.predict(count);
        fullSpline.push({x: predictObj[0], y:predictObj[1]});
        count = count + .05;
      }
    }

    fullSpline = fullSpline.slice(0, -1);

    data.forEach((item) => {
      if (item.x >= secondPointX) {
        fullSpline.push(item)
      }
    })

    return fullSpline
  }

  public async pasteData(event:ClipboardEvent) {
    this.splineCut = 0;
    let clipboardData = event.clipboardData;
    if (clipboardData){
      let pastedText = clipboardData.getData('text');
      let row_data = pastedText.split('\n');
      let numberData1: IxyGraph[] =[];

      row_data.forEach((item)=>{
          let row:IxyGraph ={x: 0, y: 0};
          let item2 = item.substring(0, item.length - 1);
          let item3 = item2.split('\t').join(',');
          let item4 = item3.split(',');
          numberData1.push({x: +item4[0], y: +item4[1]});
      });
    this.pastedSpringDataPersist = numberData1;
    this.pasteBoxString = 'Data Pasted';
    }
    this.processSpringDataPersist();
  }

  public async processSpringDataPersist(){
    this.splineEnd = await this.findXMaxValue(this.pastedSpringDataPersist);
    this.pastedSpringDataOffset = await this.offsetLoad();
    this.pastedSpringDataMod = await this.fitLinearSpringStart(this.pastedSpringDataOffset);
    let processCutdatafunct = await this.onSplineCut(this.splineCut);
    this.plotSpringSplineData();
  }

  public clearSpringSplineData(){
    this.pasteBoxString = 'Click box and Paste Ride Rate Data Here (Ctrl + V)'
    this.pastedSpringDataPersist = [];
    this.pastedSpringDataOffset = [];
    this.pastedSpringDataMod = [];
    this.rideRateOverride = [];
    this.engagedSpline = [];
    this.splineCut = 0;
    this.plotSpringSplineData();
  }

  public radialClick(){

    setTimeout(() => {
      this.plotSpringSplineData();
    }, 100);

  }

  public async checkAscendingValues(data:any[]){
    let dataFinal:any[] = [];
    dataFinal.push(data[0]); 
    for (let i = 1; i <= data.length - 1; i++){
      if (data[i].x > data[i - 1].x){
        dataFinal.push(data[i]);
      }
    }
    return dataFinal
  }

  public extendRideRateOverride(data:IxyGraph[]){
    let lastX:number = data[data.length - 1].x;
    let lastY:number = data[data.length - 1].y;

    //Extend fit with 0 rated
    let extCount:number = lastX + .1;
    for (let i = 1 ; i < 5.1 ; i++) {
      data.push({x: extCount, y: lastY})
      extCount = extCount + .1
    }
      
    //Extend fit for .5" past the last point
    // const regression = require('regression');
    // let fitData:number[][] = [];
    // data.forEach((item) => {
    //   if (item.x >= lastX - 1){
    //     fitData.push([item.x, item.y]);
    //   }
    // });

    // const result = regression.polynomial(fitData, { order: 2 });
    // let count:number = lastX + .05;
    // for (let i = 1 ; i < data.length - 1 ; i++) {
    //   if (count <= lastX + .5) {
    //     let predictObj:number[] = result.predict(count);
    //     data.push({x: predictObj[0], y:predictObj[1]});
    //     count = count + .05;
    //   }
    // }

    return data
  }

  public async onSplineCut(event:any){
    let type = typeof(event);
    if (type === 'object'){
      let cut = +event.target.value;
      this.splineCut = cut;
    }
    if (this.splineCut === 0){return};
    
    if (this.splineEnd === 0 ||
      this.splineCut === null || this.splineCut === undefined 
      || this.splineCut === null || this.splineCut === undefined)
      { alert ('Issue with undefined point or point(s) defined as 0')
        return};
        
    let rideRateOverride:IxyGraph[] = [];
    // Ride Rate Override portion (pittail)
    this.rideRateOverride = [];
    this.pastedSpringDataMod.forEach((item) => {
      if (this.splineCut !== undefined && item.x <= this.splineCut){
        rideRateOverride.push(item)
      }
    });
    this.rideRateOverride = await this.extendRideRateOverride(rideRateOverride);
    
    let engagedSpline:IxyGraph[] = [];
    // Spring Spline portion (spring)
    for (let i = 0; i < this.pastedSpringDataOffset.length - 1; i++) {
      if (this.splineCut < this.pastedSpringDataOffset[i].x && this.pastedSpringDataOffset[i].x < this.splineEnd){
        engagedSpline.push(this.pastedSpringDataOffset[i]);
        if (this.pastedSpringDataPersist[i + 1].x > this.splineEnd) { break }
      }
    }
    
    this.engagedSpline = engagedSpline;
    this.plotSpringSplineData();
  }

  public onOffsetLoad(event:any){
    this.setupSpringLoad = +event.target.value;
    this.loadOffset =  this.setupSpringLoad - this.pastedSpringDataPersist[1].y;
    this.processSpringDataPersist();
  }

  public async offsetLoad(){
    let modDataList:{x:number, y:number}[] = [];
    modDataList.push(this.pastedSpringDataPersist[0]);
    for (let i = 1; i < this.pastedSpringDataPersist.length; i++){
      if (this.setupSpringLoad == 0){
        modDataList.push({x: this.pastedSpringDataPersist[i].x, y: this.pastedSpringDataPersist[i].y});
      } else{
        modDataList.push({x: this.pastedSpringDataPersist[i].x, y: this.pastedSpringDataPersist[i].y + this.loadOffset});
      }
    }
    
    return modDataList;
  }

  public async trimEndFullData(){
    
    let cutData:IxyGraph[] = [];
    this.pastedSpringDataMod = [];
    for (let i = 0; i < this.pastedSpringDataPersist.length - 1; i++) {
      cutData.push(this.pastedSpringDataPersist[i]);
      if (this.pastedSpringDataPersist[i + 1].x > this.splineEnd) { break }
    }
    
    return cutData
  }

  public async onSplineEnd(event:any){
    let cut = +event.target.value;
    if (cut === 0){ return };
    this.splineEnd = cut;
    this.onSplineCut('event');
    this.pastedSpringDataMod = await this.trimEndFullData();

    if (this.engagedSpline.length > 0){
      let engagedSpline:IxyGraph[] = [];
      // Spring Spline portion (spring)
      for (let i = 0; i < this.engagedSpline.length - 1; i++) {
        if (this.splineCut < this.engagedSpline[i].x && this.engagedSpline[i].x < this.splineEnd){
          engagedSpline.push(this.engagedSpline[i]);
          if (this.engagedSpline[i + 1].x > this.splineEnd) { break }
        }
      }
      this.engagedSpline = engagedSpline;
    }
    
    

    this.plotSpringSplineData();
   

  }

  public async copySpring(data:IxyGraph[]){
    let array:IxyGraph[] = await this.checkAscendingValues(data);
    let string = '';
    array.forEach((item) => {
      let subString = item.x.toString() + '\t' + item.y.toString() + '\r';
      string = string + subString;
    });

    return string
  }

  public async copyFullDataset(){
    let string:string =  await this.copySpring(this.pastedSpringDataMod);
    this.clipboard.copy(string);
    this.notificationService.openSnackBar('Full Ride Rate Override Data Copied to Clipboard')
  }

  public async copyPigtail() {
    let string:string = await this.copySpring(this.rideRateOverride);
    this.clipboard.copy(string);
    this.notificationService.openSnackBar('Ride Rate Override Data Copied to Clipboard')
  }

  public async copySpline() {
    if (this.splineEnd < this.splineCut){
        alert('Spline end needs to be greater than the spline cut');
        return;
    }
    let arrayList:IxyGraph[] = await this.checkAscendingValues(this.engagedSpline);
    let xZero:number = arrayList[0].x;
    let yZero:number = arrayList[0].y;
    let normArrayList:IxyGraph[] = [];
    
    arrayList.forEach((item) => {
      let obj:IxyGraph = {x: item.x - xZero, y: item.y - yZero};
      normArrayList.push(obj);
    });
    
    let string = '';
    normArrayList.forEach((item) => {
      let subString = item.x.toString() + '\t' + item.y.toString() + '\r';
      string = string + subString;
    });

    this.clipboard.copy(string);
    this.notificationService.openSnackBar('Spring Spline Data Copied to Clipboard')
  }

  public plotSpringSplineData() {
    if (this.pastedSpringDataOffset.length === 0){this.pastedSpringDataOffset = [{x:0, y:0}]}
    let springXMin: number = 0;
    let springXMax: number = 0;
    let springXPersist:number[] = [];
    let springYPersist:number[] = [];
    springXPersist.push(this.pastedSpringDataOffset[0].x);
    springYPersist.push(this.pastedSpringDataOffset[0].y);
    for (let i:number=1; i < this.pastedSpringDataOffset.length; i++){
      let prevItem:IxyGraph = this.pastedSpringDataOffset[i-1];
      let item:IxyGraph = this.pastedSpringDataOffset[i];
        if (item.x !== undefined || item.y !== undefined) {
          if (item.x > prevItem.x || item.x === 0){
            springXPersist.push(item.x);
            springYPersist.push(item.y);
          }
        }
    }
    springXMin = Math.min(...springXPersist) - .1;
    springXMax = Math.max(...springXPersist) + .1;
    
    let dataList:IplotlySplineGraph[] = []
    
    if (this.springSplineType === 'single'){
      let fullModX:number[] = [];
      let fullModY:number[] = [];
      this.pastedSpringDataMod.forEach((item:IxyGraph) => {
        fullModX.push(item.x);
        fullModY.push(item.y);
      });

      dataList = [ 
        {
          x: springXPersist,
          y: springYPersist,
          type: 'scattergl',
          name: 'Spring Spline Data',
          mode: 'markers',
          marker: {
            color: 'blue',
            size: 8
          },
          line: {
            dash: 'solid',
            color: 'blue',
            width: 0
          }
        },
        {
          x: fullModX,
          y: fullModY,
          type: 'scattergl',
          name: 'Selected Spring Data',
          mode: 'lines',
          marker: {
            color: 'red',
            size: 0
          },
          line: {
            dash: 'dash',
            color: 'red',
            width: 2
          }
        }
      ]
    }

    if (this.springSplineType === 'cut'){

      let rroX:number[] = [];
      let rroY:number[] = [];
      this.rideRateOverride.forEach((item:IxyGraph) => {
        rroX.push(item.x);
        rroY.push(item.y);
      });

      let eX:number[] = [];
      let eY:number[] = [];
      this.engagedSpline.forEach((item:IxyGraph) => {
        eX.push(item.x);
        eY.push(item.y);
      });

      dataList = [ {
        x: springXPersist,
        y: springYPersist,
        type: 'scattergl',
        name: 'Spring Spline Data',
        mode: 'markers',
        marker: {
          color: 'blue',
          size: 8
        },
        line: {
          dash: 'solid',
          color: 'blue',
          width: 0
        }
      },
      {
        x: rroX,
        y: rroY,
        type: 'scattergl',
        name: 'Ride Rate Override Data',
        mode: 'lines',
        marker: {
          color: 'red',
          size: 0
        },
        line: {
          dash: 'dash',
          color: 'red',
          width: 2
        }
      },
      {
        x: eX,
        y: eY,
        type: 'scattergl',
        name: 'Spring Spline Data',
        mode: 'lines',
        marker: {
          color: 'black',
          size: 0
        },
        line: {
          dash: 'dash',
          color: 'black',
          width: 2
        }
      }
      ]
    }
    

    this.springGraph = this.springGraph = {
      data: dataList,
      layout: 
        {autosize: true, showlegend: true, legend: {x: .4, y: -.2, "orientation": "h"},
        title: 'Spring Travel vs Spring Load',
        xaxis: {title: 'Spring Travel (in)', zeroline: false, showline: true, range: [springXMin, springXMax]},
        yaxis: {title: 'Spring Load (lbf)', zeroline: false, showline: true},
        margin: {
          l: 70,
          r: 50,
          b: 50,
          t: 50,
          pad: 0
        }
      }
    };
    
  }
  
}

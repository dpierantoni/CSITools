import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import * as Papa from 'papaparse';

import { NotificationService } from '../../services/notification.service'

@Component({
  selector: 'bump-spring-builder',
  templateUrl: './bump-spring-builder.component.html',
  styleUrls: ['./bump-spring-builder.component.css']
})
export class BumpSpringBuilderComponent implements OnInit {
  minLoadValue:number = 10;
  loadedFileName:string = ''
  durationInSeconds = 2;
  displayedData:{x: number, y: number}[] = [];
  graph = {
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
      {autosize: true, showlegend: true, legend: {x: .45, y: -.2, "orientation": "h"}, 
      title: 'Load vs Displacement',
      xaxis: {title: 'Displacement (in)', automargin: true, zeroline: false, showline: true},
      yaxis: {title: 'Load (lbf)', zeroline: false, showline: true},
      margin: {
        l: 70,
        r: 50,
        b: 50,
        t: 50,
        pad: 0
      },
    },
  }
  
  constructor(private clipboard: Clipboard, private notificationService: NotificationService) { }

  ngOnInit(): void {
  }

  public  async fileChangeListener(files: any) {
    let file = files.target.files[0];
    if (file && this.minLoadValue !== null) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          this.displayedData =  await this.parseCSVFiletoXY(result.data);
          let plot = this.plotData();
        }
          });
    } else if(!file) {
      alert('Problem loading CSV file');
    } else if(this.minLoadValue === null){
      alert('Enter a Minimum Load Value.  Suggested default is 10 lbs');
    }
  }

  public async parseCSVFiletoXY(data:any[]){
    this.loadedFileName = data[1][1];
    let indexedData:any[]=[];
    let indexStart:number = 0;
    let zeroIndex:number = 0;
    let zeroLoad:number = 0;
    let zeroTravel:number = 0;
    data.forEach((item:any, index:number) => { //data iteration skips the empty rows in .csv between Motec header and first data row
      if (item[0] === 'PR_Disp' && item[1] === 'PR_Force'){indexStart = index}
    });
    for (let i=indexStart; i<= data.length; i++){
      if (data[i][1] >= this.minLoadValue){
        zeroIndex = i;
        zeroLoad = +data[i][1];
        zeroTravel = +data[i][0];
        break
      }
    }

    indexedData.push({x: zeroTravel - zeroTravel, y: zeroLoad - zeroLoad})
    for (let i = zeroIndex + 1; i <= data.length - 1; i++){
      let x = +data[i][0];
      let y = +data[i][1];
      if (+data[i][0] > +data[i - 1][0]){
        indexedData.push({x: data[i][0] - zeroTravel, y: data[i][1] - zeroLoad})
      }
    }
    
    return indexedData
  }

  public plotData(){
    let x:number[] = [];
    let y:number[] = [];
    this.displayedData.forEach((item:{x:number, y:number}) => {
      x.push(item.x);
      y.push(item.y);
    });

    let dataList = [
      {
        x: x,
        y: y,
        type: 'scattergl',
        name: 'Bump Spring Data',
        mode: 'markers',
        marker: {
          color: 'blue',
          size: 3
        },
        line: {
          color: 'blue',
          width: 2
        }
      }
    ]
    this.graph = {
      data: dataList,
      layout: 
        {autosize: true, showlegend: true, legend: {x: .45, y: -.2, "orientation": "h"},
        title: 'Load vs Displacement',
        xaxis: {title: 'Displacement (in)', automargin: true, zeroline: false, showline: true},
        yaxis: {title: 'Load (lbf)', zeroline: false, showline: true},
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

  public copySplineDataToClip(){
    let string = '';
    this.displayedData.forEach((item) => {
      let subString = item['x'].toString() + '\t' + item['y'].toString() + '\t' +
      item['y'].toString() + '\r';
      string = string + subString;
    });
    this.clipboard.copy(string);
    this.notificationService.openSnackBar('Bump Spring Data Copied to Clipboard')
  }

}


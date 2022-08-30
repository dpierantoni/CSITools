import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { ExportToCsv } from 'export-to-csv';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

import {inputDisplayNames} from '../../external-data/display-channel-list'
import {outputNames} from '../../external-data/output-channel-list'


@Component({
  selector: 'doefactor-matrix',
  templateUrl: './doefactor-matrix.component.html',
  styleUrls: ['./doefactor-matrix.component.css']
})
export class DOEFactorMatrixComponent implements OnInit {


  simOutputList = outputNames;

  done = [
    ''
  ];

  public async emptyList(){
    if (this.simOutputList.length < 1){this.simOutputList = ['']}
    if (this.done.length < 1){this.done = ['']}
  }

  public async drop(event: CdkDragDrop<string[]>) {
    let emptyCheck = await this.emptyList();
    

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }

    if (this.simOutputList.length > 1){
      const index = this.simOutputList.indexOf('');
      this.simOutputList.splice(index, 1);}
    if (this.done.length > 1){
      const index = this.done.indexOf('');
      if (index > -1) {
        this.done.splice(index, 1);
      }
    }

    emptyCheck = await this.emptyList();
  }
  
  exportIsDisabled:boolean = true;
  inputFactorMatrix: any[] = [];
  lowValue = '';
  highValue = '';
  channelOptions:string[] = inputDisplayNames;
  channelOptionsFiltered: string[] | undefined = this.channelOptions; 
  testString: string = '';

  constructor(private http: HttpClient) { 
    
  }
  
  
  ngOnInit(): void {
    
  }

  onKey(event: any, i:number) { 
    let value2 = event.target.value;
    this.inputFactorMatrix[i].channelOptionsFiltered = this.search(value2);
  }

  search(value: string) { 
    let filter = value.toLowerCase();
    return this.channelOptions.filter(option => option.toLowerCase().includes(filter));
  }

  addFactor(){
    let factorObj: any = {channel:'', unit:'', low: null, high: null, channelOptionsFiltered: this.channelOptions};
    this.inputFactorMatrix.push(factorObj);
    if (this.inputFactorMatrix.length > 0) {
      this.exportIsDisabled = false;
    }
  }

  onChannelSelect(i:number) {
    this.inputFactorMatrix[i]['low'] = null
    this.inputFactorMatrix[i]['high'] = null
  }

  deleteFactor(i:number){
    this.inputFactorMatrix.splice(i, 1);
    if (this.inputFactorMatrix.length === 0) {
      this.exportIsDisabled = true;
    }
  }

  addChannel(channel:string, i:number) {
    this.inputFactorMatrix[i].channel = channel;
  }

  addLowValue(lowValue:string, i: number) {
    this.inputFactorMatrix[i].low = +lowValue;
  }

  addHighValue(highValue:string, i: number) {
    this.inputFactorMatrix[i].high = +highValue;
  }

  public fileChangeListener(files: any) {
    let file = files.target.files[0]
    if (file) {
        this.inputFactorMatrix = []
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          this.inputFactorMatrix = result.data;
          // Add filtered channel options so instance of object is full with all names avail
          this.inputFactorMatrix.forEach((element) => {
            element['channelOptionsFiltered'] = this.channelOptions; 
          });
          if (this.inputFactorMatrix.length > 0) {
            this.exportIsDisabled = false;
          }
        }});
    
    } else {
      alert('Problem loading CSV file');
    }
    
  }

  exportFactorMatrix(){
    const options = { 
      fieldSeparator: ',',
      filename: 'DOEInputFactorTable',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: false, 
      showTitle: false,
      title: 'My Awesome CSV',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
      // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
    };
   
  const csvExporter = new ExportToCsv(options);
  let exportTable: any[] = []
  this.inputFactorMatrix.forEach((element) => {
    let obj = {channel: null, 'unit': null, 'low':null, 'high':null};
    obj.channel = element.channel;
    obj.unit = element.unit;
    obj.low = element.low;
    obj.high = element.high;
    exportTable.push(obj);
    });
  
  csvExporter.generateCsv(exportTable);
  }


 
  onClick() {
    this.http.get<any>('http://127.0.0.1:5000/processbatchGET/testFilePath').subscribe(data => {
      this.testString = data;
      
    });
  }
}



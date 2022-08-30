import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { BumpSpringViewerComponent } from './bump-spring-viewer.component';


@NgModule({
  declarations: [
    BumpSpringViewerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    PlotlyModule

  ],
  exports: [
    BumpSpringViewerComponent
  ]
})
export class BumpSpringViewerModule { }

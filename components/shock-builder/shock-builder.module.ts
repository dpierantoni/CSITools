import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

import { ShockBuilderComponent } from '../shock-builder/shock-builder.component'

@NgModule({
  declarations: [
    ShockBuilderComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    PlotlyModule
  ],
  exports: [
    ShockBuilderComponent
  ]
})

export class ShockBuilderModule { }

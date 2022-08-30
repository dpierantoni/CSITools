import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

import {BumpSpringBuilderComponent} from './bump-spring-builder.component'


@NgModule({
  declarations: [
    BumpSpringBuilderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    PlotlyModule
  ],
  exports: [
    BumpSpringBuilderComponent
  ]
})
export class BumpSpringBuilderModule { }

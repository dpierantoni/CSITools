import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input'
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTableModule} from '@angular/material/table';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DOEFactorMatrixComponent } from './components/doefactor-matrix/doefactor-matrix.component';
import { BatchCreationComponent } from './components/batch-creation/batch-creation.component';
import { SubmitDialogModule } from '../app/components/submit-dialog/submit-dialog.module';
import { SpringSplineBuilderModule } from './components/spring-spline-builder/spring-spline-builder.module';
import { BumpSpringBuilderModule } from './components/bump-spring-builder/bump-spring-builder.module';
import { BumpSpringViewerModule } from './components/bump-spring-viewer/bump-spring-viewer.module';
import { ShockBuilderModule } from './components/shock-builder/shock-builder.module';
import { NotificationComponent } from './components/notification/notification.component';
import { SubmitCloudDialogModule } from './components/submit-cloud-dialog/submit-cloud-dialog.module';


@NgModule({
  declarations: [
    AppComponent,
    DOEFactorMatrixComponent,
    BatchCreationComponent,
    NotificationComponent,
        
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule, 
    ReactiveFormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatSelectModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatSnackBarModule,
    SubmitDialogModule,
    SubmitCloudDialogModule,
    SpringSplineBuilderModule,
    BumpSpringBuilderModule,
    BumpSpringViewerModule,
    ShockBuilderModule,
    ClipboardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import {NgModule} from '@angular/core';
import {AlertsComponent} from './alerts.component';
import {AlertsRoutingModule} from './alerts-routing.module';
import {CommonModule} from '@angular/common';
import {DataFilterPipe} from './datafilterpipe';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DataTablesModule} from 'angular-datatables';
import {MomentModule} from 'ngx-moment';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ModalModule} from 'ngx-bootstrap/modal';
import {GoogleMapsAPIWrapper} from '@agm/core';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {LeafletDrawModule} from '@asymmetrik/ngx-leaflet-draw';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    AlertsRoutingModule,
    CommonModule,
    DataTablesModule,
    FormsModule,
    MomentModule,
    TooltipModule.forRoot(),
    AngularMultiSelectModule,
    ModalModule.forRoot(),
    ReactiveFormsModule,
    LeafletModule,
    LeafletDrawModule,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  providers: [
    GoogleMapsAPIWrapper
  ],
  declarations: [
    AlertsComponent,
    DataFilterPipe
  ]
})
export class AlertsModule {
}

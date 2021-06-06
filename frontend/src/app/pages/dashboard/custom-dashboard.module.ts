import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomDashboardRoutingModule} from './custom-dashboard-routing.module';
import {CustomDashboardComponent} from './custom-dashboard.component';
import {NgxGaugeModule} from 'ngx-gauge';
import {ToastrModule} from 'ngx-toastr';
import {AgmCoreModule, GoogleMapsAPIWrapper} from '@agm/core';
import {FormsModule} from '@angular/forms';
import {AlertModule} from 'ngx-bootstrap/alert';
import {MomentModule} from 'ngx-moment';
import {DataTablesModule} from 'angular-datatables';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown';
import {DirectionsDirective} from './directions.directive';
import {AgmMarkerClustererModule} from '@agm/markerclusterer';
import {ChartsModule} from 'ng2-charts';
import {NvD3Module} from 'ng2-nvd3';
import {TranslateModule} from '@ngx-translate/core';
// d3 and nvd3 should be included somewhere
import 'd3';
//import 'nvd3';

@NgModule({
  imports: [
    AlertModule,
    CommonModule,
    CustomDashboardRoutingModule,
    NgxGaugeModule,
    FormsModule,
    ToastrModule.forRoot(),
    DataTablesModule,
    MomentModule,
    TooltipModule.forRoot(),
    AgmCoreModule,
    ChartsModule,
    AgmMarkerClustererModule,
    AngularMultiSelectModule,
    ModalModule.forRoot(),
    NvD3Module,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  providers: [
    GoogleMapsAPIWrapper
  ],
  declarations: [
    CustomDashboardComponent,
    DirectionsDirective
  ]
})
export class CustomDashboardModule {
}

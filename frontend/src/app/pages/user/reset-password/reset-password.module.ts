import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ResetPasswordRoutingModule} from "./reset-password-routing.module";
import {ResetPasswordComponent} from "./reset-password.component";
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    ResetPasswordRoutingModule,
    CommonModule,
    FormsModule,
    TranslateModule.forChild({
      extend: true
    }),
  ],
  declarations: [
    ResetPasswordComponent
  ]
})
export class ResetPasswordModule {
}

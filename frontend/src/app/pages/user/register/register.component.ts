import {Component} from '@angular/core';
import {AccessToken, AppSetting, User} from '../../../shared/sdk/models';
import {UserApi, AppSettingApi} from '../../../shared/sdk/services';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {RealtimeService} from "../../../shared/realtime/realtime.service";
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  templateUrl: 'register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent {

  public user: User = new User();
  public verifyPassword = '';
  public errorMessage = '';

  private settings: AppSetting[] = [];

  private canUserRegister: any = false;

  constructor(private rt: RealtimeService,
              private userApi: UserApi,
              private appSettingApi: AppSettingApi,
              private router: Router,
              private translate: TranslateService) {
    this.getAppSettings();
  }

  onRegister(): void {
    console.log('Registering');
    if (this.user.password !== this.verifyPassword) {
      this.errorMessage = this.translate.instant('error.not_match_password');
      return;
    }

    this.user.email = this.user.email.toLocaleLowerCase();

    this.user.id = null;
    this.user.createdAt = new Date();

    this.userApi.create(this.user).subscribe((user: User) => {
      this.onLogin();
    }, err => {
      // console.log(err);
      if (err.statusCode === 422)
        this.errorMessage = this.translate.instant('error.conflict_email');
      else
        this.errorMessage = this.translate.instant('error.invalid_format');
    });
  }

  clear(): void {
    this.errorMessage = '';
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  getAppSettings(): void {
    this.appSettingApi.find().subscribe((settings: AppSetting[])=> {
      this.settings = settings;
      let temp = _.filter(settings, {key: 'canUserRegister'});
      this.canUserRegister = temp[0].value;
      if(this.canUserRegister == false){
        this.router.navigate(['/login']);
      }
      console.log(this.canUserRegister);
    });
  }
}

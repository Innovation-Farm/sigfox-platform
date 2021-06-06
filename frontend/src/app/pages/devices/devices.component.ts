import {AppSetting, Category, Connector, Device, Geoloc, Organization, Parser, User} from '../../shared/sdk/models';
import {Subscription} from 'rxjs/Subscription';
import {AgmInfoWindow} from '@agm/core';
import {
  AppSettingApi,
  DeviceApi,
  MessageApi,
  OrganizationApi,
  ParserApi,
  UserApi
} from '../../shared/sdk/services/custom';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DOCUMENT} from '@angular/common';
import {saveAs} from 'file-saver';
import * as moment from 'moment';
import {ActivatedRoute} from '@angular/router';
import {RealtimeService} from "../../shared/realtime/realtime.service";
import {Observable} from "rxjs";
import {DataFilterPipe} from "./datafilterpipe";
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit, OnDestroy {

  private user: User;

  public filterQuery = '';

  public organization: Organization;
  private organizations: Organization[] = [];

  @ViewChildren(AgmInfoWindow) agmInfoWindow: QueryList<AgmInfoWindow>;
  @ViewChild('confirmModal') confirmModal: any;
  @ViewChild('confirmDBModal') confirmDBModal: any;
  @ViewChild('confirmParseModal') confirmParseModal: any;
  @ViewChild('shareDeviceWithOrganizationModal') shareDeviceWithOrganizationModal: any;

  // Flags
  private isCircleVisible: boolean[] = [];

  private connectors: Connector[] = [];

  private showDeviceSuccessRate: AppSetting;

  private organizationRouteSub: Subscription;

  private categories: Category[] = [];
  public displayedDevices: Device[] = [];
  private parsers: Parser[] = [];

  public deviceToEdit: Device = new Device();
  public deviceToRemove: Device = new Device();

  public selectOrganizations: Array<any> = [];
  public selectedOrganizations: Array<any> = [];

  public edit = false;
  private loadingFromBackend = false;
  private loadingParseMessages = false;
  private loadingDownload = false;

  private mapLat = 36.3155448;
  private mapLng = 138.506677;
  private mapZoom = 6;

  public selectOrganizationsSettings = {
    singleSelection: false,
    text: 'Select organizations',
    selectAllText: 'Select all',
    unSelectAllText: 'Unselect all',
    enableSearchFilter: true,
    classes: 'select-organization'
  };

  // Pagination
  rowsOnPage = 30;
  activePage = 1;
  total: number;
  loading: boolean;
  searchFilter: string;

  private api;
  private id;
  private timer;

  constructor(private rt: RealtimeService,
              private userApi: UserApi,
              private organizationApi: OrganizationApi,
              private parserApi: ParserApi,
              private appSettingApi: AppSettingApi,
              private deviceApi: DeviceApi,
              private elRef: ElementRef,
              @Inject(DOCUMENT) private document: any,
              private messageApi: MessageApi,
              private route: ActivatedRoute,
              private http: HttpClient) {
  }

  ngOnInit(): void {
    console.log('Devices: ngOnInit');
    // Get the logged in User object
    this.user = this.userApi.getCachedCurrent();

    // Get the user connectors
    this.userApi.getConnectors(this.user.id).subscribe((connectors: Connector[]) => {
      this.connectors = connectors;
    });

    // Get app settings
    this.appSettingApi.findById('showDeviceSuccessRate').subscribe((appSetting: AppSetting) => {
      this.showDeviceSuccessRate = appSetting;
    });

    // Hide all circles by default
    this.setCircles();

    // Check if organization view
    this.organizationRouteSub = this.route.parent.parent.params.subscribe(parentParams => {
      if (parentParams.id) {
        this.userApi.findByIdOrganizations(this.user.id, parentParams.id).subscribe((organization: Organization) => {
          this.organization = organization;
          this.setup();
        });
      } else {
        this.setup();
      }
    });
  }

  download(type: string) {
    this.loadingDownload = true;
    const url = environment.callbackUrl + '/api/Devices/download/' + this.deviceToEdit.id + '/' + type + '?access_token=' + this.userApi.getCurrentToken().id;

    this.http.get(url, {responseType: 'blob'}).subscribe(res => {
      const blob: Blob = new Blob([res], {type: 'text/csv'});
      const today = moment().format('YYYY.MM.DD');
      const filename = today + '_' + this.deviceToEdit.id + '_export.csv';
      saveAs(blob, filename);
      this.loadingDownload = false;
    }, err => {
      console.log(err);
      this.loadingDownload = false;
    });
  }

  setCircles() {
    for (let i = 0; i < this.displayedDevices.length; i++) {
      this.isCircleVisible.push(false);
    }
  }

  markerOut(i) {
    this.isCircleVisible[i] = false;
  }

  markerOver(i) {
    this.isCircleVisible[i] = true;
  }

  setup(): void {
    this.api = this.organization ? this.organizationApi : this.userApi;
    this.id = this.organization ? this.organization.id : this.user.id;
    this.unsubscribe();
    this.subscribe();

    this.loading = true;
    this.loadDevice(1).subscribe((r: any) => {
      this.loading = false;
      this.displayedDevices = r;
    });
    this.parserApi.find({order: 'createdAt DESC'}).subscribe((result: any) => {
      this.parsers = result;
    });
    this.api.getCategories(this.id).subscribe((result: any) => {
      this.categories = result;
    });
  }

  private queryFilter = {
    where: {},
    limit: this.rowsOnPage,
    skip: 0, //this.rowsOnPage * (page - 1),
    order: 'messagedAt DESC',
    include: ['Parser', 'Category', 'Organizations', {
      relation: 'Messages',
      scope: {
        limit: 1,
        order: 'createdAt DESC',
        include: [{
          relation: 'Geolocs',
          scope: {
            order: 'createdAt DESC'
          }
        }]
      }
    }]
  };

  private loadDevice(page: number): Observable<any> {
    console.log("load device");
    return this.api.getDevices(this.id, this.queryFilter);
  }

  // search box
  onKey(event: KeyboardEvent, value: string) { // with type info
    if (event.key === "Enter") return;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.search(value);
    },500);
  }

  search(value: string) {
    this.searchFilter = value;
    clearInterval(this.timer);
    this.queryFilter.where = {or: [{id: {regexp: `/.*${value}.*/i`}}, {name: {regexp: `/.*${value}.*/i`}}]};
    this.loadDevice(1);
  }

  ngOnDestroy(): void {
    console.log('Devices: ngOnDestroy');
    this.cleanSetup();
  }

  private cleanSetup() {
    if (this.organizationRouteSub) this.organizationRouteSub.unsubscribe();
    this.unsubscribe();
  }

  editDevice(device): void {
    this.edit = true;
    this.deviceToEdit = device;
  }

  updateDevice(): void {
    this.edit = false;
    this.api.updateByIdDevices(this.id, this.deviceToEdit.id, this.deviceToEdit).subscribe(value => {
      console.log('succeeded update: ', value);
    }, err => {
      console.error(err);
    });
  }

  updateDeviceCategory(): void {
    console.log(this.deviceToEdit.categoryId);
    if (this.deviceToEdit.categoryId) {
      this.api.findByIdCategories(this.id, this.deviceToEdit.categoryId).subscribe((category: Category) => {
        console.log(category);
        this.deviceToEdit.properties = category.properties;
      }, err => {
        console.error(err);
      });
    }

    console.log(this.deviceToEdit);
    // this.deviceRef.upsert(device).subscribe();
  }

  showRetrievalModal(): void {
    this.confirmDBModal.show();
  }

  showParseModal(): void {
    this.confirmParseModal.show();
  }

  retrieveMessages(deviceId: string, limit: number, before: number): void {
    this.userApi.getConnectors(this.user.id, {where: {type: 'sigfox-api'}}).subscribe((connectors: Connector[]) => {
      if (connectors.length > 0) {
        this.loadingFromBackend = true;
        this.deviceApi.getMessagesFromSigfoxBackend(deviceId, null, before ? before : null, null).subscribe(result => {
          console.log(result);
          if (result.paging.next) {
            const before = result.paging.next.substring(result.paging.next.indexOf('before=') + 7);
            this.retrieveMessages(deviceId, null, before);
          } else {
            console.log('Finished process');
            this.loadingFromBackend = false;
          }
        }, err => {
          this.loadingFromBackend = false;
        });
        this.confirmDBModal.hide();
      } else {
        console.warn('Warning', 'Please refer your Sigfox API credentials in the connectors page first.');
      }
    });
  }

  parseAllMessages(deviceId: string): void {
    this.loadingParseMessages = true;
    // Disconnect real-time to avoid app crashing
    this.parserApi.parseAllMessages(deviceId, null, null).subscribe(result => {
      this.loadingParseMessages = false;
      if (result.message === 'Success') {
        console.log('Success', 'All the messages were successfully parsed.');
      } else {
        this.loadingParseMessages = false;
        console.warn(result.message);
      }
    });
    this.confirmParseModal.hide();
  }

  zoomOnDevice(geoloc: Geoloc): void {
    window.scrollTo(0, 0);
    this.agmInfoWindow.forEach((child) => {
      // console.log(child['_el'].nativeElement.id);
      if (child['_el'].nativeElement.id === geoloc.id)
        child.open();
      else
        child.close();
    });

    this.mapLat = geoloc.location.lat;
    this.mapLng = geoloc.location.lng;
    this.mapZoom = 12;
  }

  cancel(): void {
    this.edit = false;
  }

  showRemoveModal(device: Device): void {
    this.confirmModal.show();
    this.deviceToRemove = device;
  }

  remove(): void {
    this.userApi.destroyByIdDevices(this.user.id, this.deviceToRemove.id).subscribe(value => {
      this.edit = false;
      this.confirmModal.hide();
      console.log('The device and its messages were successfully deleted.');
    }, err => {
      console.error('Not allowed.');
    });
  }

  showShareDeviceWithOrganizationModal(): void {
    this.selectOrganizations = [];
    this.userApi.getOrganizations(this.user.id).subscribe((organizations: Organization[]) => {
      this.organizations = organizations;
      this.organizations.forEach(organization => {
        const item = {
          id: organization.id,
          itemName: organization.name
        };
        let addOrganization = true;
        this.deviceToEdit.Organizations.forEach(deviceOrganization => {
          if (deviceOrganization.id === organization.id) {
            addOrganization = false;
            return;
          }
        });
        if (addOrganization) {
          this.selectOrganizations.push(item);
        }
      });
      this.shareDeviceWithOrganizationModal.show();
    });
  }

  shareDeviceWithOrganization(deviceId): void {
    this.selectedOrganizations.forEach(orga => {
      this.deviceApi.linkOrganizations(deviceId, orga.id).subscribe(results => {
        console.log(results);
        this.shareDeviceWithOrganizationModal.hide();
        this.organizationApi.findById(orga.id).subscribe((org: Organization) => {
          this.deviceToEdit.Organizations.push(org);
        });
      }, err => {
        console.error(err.error);
      });
    });
  }

  unshare(orga, device, index): void {
    this.deviceApi.unlinkOrganizations(device.id, orga.id).subscribe(results => {
      console.log(results);
      console.log('The device has been removed from ' + orga.name);
      this.deviceToEdit.Organizations.splice(index, 1);
    }, err => {
      console.error(err.message);
    });
  }

  rtHandler = (payload: any) => {
    const device = payload.content;
    if (device.userId == this.user.id || (this.organization && device.Organizations.map(x => x.id).includes(this.organization.id))) {
      if (payload.action == "CREATE") {
        if (this.activePage !== 1) return;
        if (this.displayedDevices.length === this.rowsOnPage)
          this.displayedDevices.pop();
        this.displayedDevices.unshift(payload.content);
        // apply search filter
        this.displayedDevices = new DataFilterPipe().transform(this.displayedDevices, this.searchFilter);
      } else if (payload.action == "DELETE") {
        this.displayedDevices = this.displayedDevices.filter(function (device) {
          return device.id !== payload.content.id;
        });
      } else if (payload.action == "UPDATE") {
        let idx = this.displayedDevices.findIndex(x => x.id == payload.content.id);
        if (idx != -1) {
          // keep geolocs, payload does not have geoloc inside message
          if (this.displayedDevices[idx].Messages[0]) {
            const lastMsg = this.displayedDevices[idx].Messages[0];
            if (device && device.Messages[0] && device.Messages[0].id == lastMsg.id) {
              device.Messages[0] = lastMsg;
            }
          }
          this.displayedDevices[idx] = payload.content;
        }
      }
    }
  };

  rtLastMessageHandler = (payload: any) => {
    if (payload.action == "CREATE" || payload.action == "UPDATE") {
      let idx = this.displayedDevices.findIndex(x => x.id == payload.content.Device.id);
      if (idx != -1) {
        let updatedDevice = this.displayedDevices[idx];
        updatedDevice.Messages = [payload.content];
        this.displayedDevices[idx] = updatedDevice;
      }
    }
  };

  geolocHandler = (payload: any) => {
    if (payload.action == "CREATE") {
      for (let device of this.displayedDevices) {
        let lastMsg = device.Messages[0];
        if (!lastMsg) continue;
        if (lastMsg.id == payload.content.messageId) {
          lastMsg.Geolocs ? lastMsg.Geolocs.push(payload.content) : lastMsg.Geolocs = [payload.content];
          return;
        }
      }
    }
  };


  subscribe(): void {
    this.rt.informCurrentPage(this.id, ['device', 'message', 'geoloc']);
    this.rtHandler = this.rt.addListener("device", this.rtHandler);
    this.rtLastMessageHandler = this.rt.addListener("message", this.rtLastMessageHandler);
    this.geolocHandler = this.rt.addListener("geoloc", this.geolocHandler);
  }

  unsubscribe(): void {
    this.rt.removeListener(this.rtHandler);
    this.rt.removeListener(this.rtLastMessageHandler);
    this.rt.removeListener(this.geolocHandler);
  }
}

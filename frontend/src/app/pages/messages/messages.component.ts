import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  Connector,
  Geoloc,
  Message,
  Organization,
  Reception,
  Role,
  User
} from '../../shared/sdk/models';
import { MessageApi, UserApi } from '../../shared/sdk/services';
import { Subscription } from 'rxjs/Subscription';
import {
  OrganizationApi,
  ReceptionApi
} from '../../shared/sdk/services/custom';
import { AgmMap } from '@agm/core';
import { ActivatedRoute } from '@angular/router';
import { RealtimeService } from '../../shared/realtime/realtime.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  private deviceIdSub: any;
  public user: User;

  @ViewChild('mapModal') mapModal: any;
  @ViewChild('agmMap') agmMap: AgmMap;

  // Flags
  public messagesReady = false;

  public mapLat = 48.856614;
  public mapLng = 2.352222;
  public mapZoom = 10;
  public receptions: any[] = [];
  public geolocs: Geoloc[] = [];

  private organizationRouteSub: Subscription;
  public messages: Message[] = [];

  public organization: Organization;

  private messageFilter: any;
  public filterQuery = '';

  private api: any;
  private id: any;
  private admin = false;

  constructor(
    private userApi: UserApi,
    private messageApi: MessageApi,
    private organizationApi: OrganizationApi,
    private receptionApi: ReceptionApi,
    private route: ActivatedRoute,
    private rt: RealtimeService
  ) {
  }

  ngOnInit(): void {
    // Get the logged in User object
    this.user = this.userApi.getCachedCurrent();
    this.userApi.getRoles(this.user.id).subscribe((roles: Role[]) => {
      this.user.roles = roles;
      roles.forEach((role: Role) => {
        if (role.name === 'admin') {
          this.admin = true;
          return;
        }
      });

      // Check if organization view
      this.organizationRouteSub = this.route.parent.parent.params.subscribe(
        parentParams => {
          if (parentParams.id) {
            this.userApi
              .findByIdOrganizations(this.user.id, parentParams.id)
              .subscribe((organization: Organization) => {
                this.organization = organization;
                this.setup();
              });
          } else this.setup();
        }
      );
    });
  }

  setup(): void {
    // Get and listen messages
    this.deviceIdSub = this.route.params.subscribe(params => {
      this.filterQuery = params['id'];
      if (this.filterQuery) {
        this.messageFilter = {
          order: 'createdAt DESC',
          limit: 30,
          include: ['Device', 'Geolocs'],
          where: { deviceId: this.filterQuery }
        };
      } else {
        this.messageFilter = {
          order: 'createdAt DESC',
          limit: 30,
          include: ['Device', 'Geolocs']
        };
      }
      this.api = this.organization ? this.organizationApi : this.userApi;
      this.id = this.organization ? this.organization.id : this.user.id;
      this.unsubscribe();
      this.subscribe(this.id);

      if (this.organization) {
        this.organizationApi
          .getFilteredMessages(this.organization.id, this.messageFilter)
          .subscribe((messages: Message[]) => {
            this.messages = messages;
            this.messagesReady = true;
          });
      } else if (this.admin && this.filterQuery) {
        this.messageApi
          .find(this.messageFilter)
          .subscribe((messages: Message[]) => {
            this.messages = messages;
            this.messagesReady = true;
          });
      } else {
        this.userApi
          .getMessages(this.user.id, this.messageFilter)
          .subscribe((messages: Message[]) => {
            this.messages = messages;
            this.messagesReady = true;
          });
      }
    });
  }

  ngOnDestroy(): void {
    console.log('Messages: ngOnDestroy');
    this.cleanSetup();
  }

  private cleanSetup() {
    if (this.organizationRouteSub) this.organizationRouteSub.unsubscribe();
    if (this.deviceIdSub) this.deviceIdSub.unsubscribe();
    this.unsubscribe();
  }

  deleteMessage(message: Message): void {
    this.userApi.destroyByIdMessages(this.user.id, message.id).subscribe(
      value => {
        console.log('succeeded destroy.');
      },
      err => {
        console.error('faild destroy.');
      },
    );
  }

  showMarkers(message: Message): void {
    this.geolocs = [];
    this.receptions = [];
    this.mapZoom = 10;

    // Message geoloc
    if (message.Geolocs && message.Geolocs.length > 0) {
      this.geolocs = message.Geolocs;
      this.mapLat = message.Geolocs[0].location.lat;
      this.mapLng = message.Geolocs[0].location.lng;
      // Show map
      this.mapModal.show();
      this.mapModal.onShown.subscribe((reason: string) => {
        this.agmMap.triggerResize();
      });
    }

    // Coverage
    this.userApi
      .getConnectors(this.user.id, { where: { type: 'sigfox-api' } })
      .subscribe((connectors: Connector[]) => {
        if (connectors.length > 0) {
          // Show map
          this.mapModal.show();
          // Get receptions
          this.receptionApi
            .getBaseStationsByDeviceId(message.deviceId, message.time)
            .subscribe(
              (receptionsResult: Reception[]) => {
                this.receptions = receptionsResult;
                if (this.receptions.length > 0) {
                  this.receptions.forEach((reception, i) => {
                    this.receptions[i].lat = Number(reception.lat);
                    this.receptions[i].lng = Number(reception.lng);
                  });
                  if (!message.Geolocs) {
                    this.mapLat = this.receptions[0].location.lat;
                    this.mapLng = this.receptions[0].location.lng;
                  }
                  this.mapModal.onShown.subscribe((reason: string) => {
                    this.agmMap.triggerResize();
                  });
                }
              },
              error => {
                console.log(error);
              }
            );
        } else {
          console.log('No Sigfox API connector');
        }
      });
  }

  download(): void {}

  rtHandler = (payload: any) => {
    const msg = payload.content;
    if (msg.userId == this.user.id || (this.organization && msg.Device.Organizations.map(x => x.id).includes(this.organization.id))) {
      if (payload.action == 'CREATE') {
        for (const geoloc of this.geolocBuffer) {
          if (geoloc.content.messageId === msg.id) {
            msg.Geolocs.push(geoloc.content);
            let index = this.geolocBuffer.indexOf(geoloc);
            if (index > -1) {
              this.geolocBuffer.splice(index, 1);
            }
            break;
          }
        }
        this.messages.unshift(msg);
      } else if (payload.action == 'DELETE') {
        this.messages = this.messages.filter(msg => {
          return msg.id !== payload.content.id;
        });
      }
    }
  };

  private geolocBuffer = [];
  geolocHandler = (payload: any) => {
    if (payload.action === 'CREATE') {
      for (let msg of this.messages) {
        if (msg.id === payload.content.messageId) {
          msg.Geolocs
            ? msg.Geolocs.push(payload.content)
            : (msg.Geolocs = [payload.content]);
          return;
        }
      }
      this.geolocBuffer.push(payload);
    }
  };

  subscribe(id: string): void {
    this.rt.informCurrentPage(id, ['message', 'geoloc']);
    this.rtHandler = this.rt.addListener('message', this.rtHandler);
    this.geolocHandler = this.rt.addListener('geoloc', this.geolocHandler);
  }

  unsubscribe(): void {
    this.rt.removeListener(this.rtHandler);
    this.rt.removeListener(this.geolocHandler);
  }
}

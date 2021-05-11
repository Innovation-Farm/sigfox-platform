import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Parser, Role, User} from '../../shared/sdk/models';
import {ParserApi, UserApi} from '../../shared/sdk/services/custom';
import {ToastrConfig, ToastrService} from 'ngx-toastr';
import {RealtimeService} from "../../shared/realtime/realtime.service";

@Component({
  templateUrl: './parsers.component.html',
  styleUrls: ['./parsers.component.scss']
})
export class ParsersComponent implements OnInit, OnDestroy {

  public user: User;

  @ViewChild('confirmModal') confirmModal: any;
  @ViewChild('confirmParseModal') confirmParseModal: any;

  public parserToAdd: Parser = new Parser();
  public parserToEdit: Parser = new Parser();
  public parserToRemove: Parser = new Parser();
  private decodedPayload = [];
  private testPayload = [];
  public parsers: Parser[] = [];

  // Notifications
  private toast;
  private toasterService: ToastrService;
  public toasterconfig = {
    tapToDismiss: true,
    timeout: 5000,
    animation: 'fade'
  };

  private admin = false;

  constructor(private rt: RealtimeService,
              private userApi: UserApi,
              toasterService: ToastrService,
              private parserApi: ParserApi) {
    this.toasterService = toasterService;
  }

  ngOnInit(): void {
    console.log('Parsers: ngOnInit');
    this.setup();
    this.parserToAdd.function = 'var payload,\n' +
      '  temperature,\n' +
      '  parsedData = [],\n' +
      '  obj = {};\n' +
      '\n' +
      '// If byte #1 of the payload is temperature (hex to decimal)\n' +
      'temperature = parseInt(payload.slice(0, 2), 16);\n' +
      '\n' +
      '// Store objects in parsedData array\n' +
      'obj = {};\n' +
      'obj.key = \'temperature\';\n' +
      'obj.value = temperature;\n' +
      'obj.type = \'number\';\n' +
      'obj.unit = \'°C\';\n' +
      'parsedData.push(obj);\n' +
      '\n' +
      '//console.log(parsedData);\n' +
      'return parsedData;';
  }

  setup(): void {
    // Get the logged in User object
    this.user = this.userApi.getCachedCurrent();
    this.unsubscribe();
    this.subscribe(this.user.id);
    this.userApi.getRoles(this.user.id).subscribe((roles: Role[]) => {
      this.user.roles = roles;
      roles.forEach((role: Role) => {
        if (role.name === 'admin') {
          this.admin = true;
          return;
        }
      });
    });

    // Parsers
    this.parserApi.find({
      order: 'updatedAt DESC'
    }).subscribe((parsers: Parser[]) => {
      this.parsers = parsers;
    });
  }

  ngOnDestroy(): void {
    console.log('Parsers: ngOnDestroy');
    this.cleanSetup();
  }

  private cleanSetup() {
    this.unsubscribe();
  }

  decodePayload(i: number, parser: Parser, payload: string): void {
    this.testPayload[i] = true;
    if (payload) {
      const fn = Function('payload', parser.function);
      this.decodedPayload[i] = fn(payload);
    } else {
      this.decodedPayload[i] = [{'error': 'Please fill input'}];
      setTimeout(function () {
        this.testPayload[i] = false;
      }.bind(this), 2000);
    }
  }

  closeDecodedPayload(i: number) {
    this.testPayload[i] = false;
  }

  setHidden(parser: Parser) {
    this.parserApi.upsertPatch(parser).subscribe((updatedParser: Parser) => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      if (updatedParser.hidden) this.toast = this.toasterService.success('Success', 'The parser was successfully hidden.', this.toasterconfig);
      else this.toast = this.toasterService.success('Success', 'The parser was successfully unhidden.', this.toasterconfig);
      this.parserApi.countDevices(parser.id).subscribe(result => {
        if (result.count > 0) {
          this.parserToEdit = parser;
          this.confirmParseModal.show();
        }
      });
    }, err => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.error('Error', 'Not allowed.', this.toasterconfig);
    });
  }

  create(): void {
    this.userApi.createParsers(this.user.id, this.parserToAdd).subscribe(value => {
      this.parserToAdd = new Parser();
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.success('Success', 'The parser was successfully created.', this.toasterconfig);
    }, err => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.error('Error', err.error.message, this.toasterconfig);
    });
  }

  update(parser: Parser): void {
    this.parserApi.upsertPatch(parser).subscribe((updatedParser: Parser) => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.success('Success', 'The parser was successfully updated.', this.toasterconfig);
      this.parserApi.countDevices(parser.id).subscribe(result => {
        if (result.count > 0) {
          this.parserToEdit = parser;
          this.confirmParseModal.show();
        }
      });
    }, err => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.error('Error', 'Not allowed.', this.toasterconfig);
    });
  }

  updateParsedData() {
    this.parserApi.parseAllDevices(this.parserToEdit.id, null, null).subscribe(result => {
      if (result.message === 'Success') {
        if (this.toast) {
          this.toasterService.clear(this.toast.toastId);
        }
        this.toast = this.toasterService.success('Success', 'All the messages were successfully parsed.', this.toasterconfig);
        this.confirmParseModal.hide();
      } else {
        if (this.toast) {
          this.toasterService.clear(this.toast.toastId);
        }
        this.toast = this.toasterService.warning('Warning', result.message, this.toasterconfig);
        this.confirmParseModal.hide();
      }
    });
  }

  showRemoveModal(parser: Parser): void {
    this.confirmModal.show();
    this.parserToRemove = parser;
  }

  remove(): void {
    this.userApi.destroyByIdParsers(this.user.id, this.parserToRemove.id).subscribe(value => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.success('Success', 'The parser was successfully deleted.', this.toasterconfig);
    }, err => {
      if (this.toast) {
        this.toasterService.clear(this.toast.toastId);
      }
      this.toast = this.toasterService.error('Error', 'Not allowed.', this.toasterconfig);
    });
    this.confirmModal.hide();
  }

  rtHandler = (payload: any) => {
    if (payload.action == "CREATE") {
      this.parsers.unshift(payload.content);
    } else if (payload.action == "DELETE") {
      this.parsers = this.parsers.filter(function (parser) {
        return parser.id !== payload.content.id;
      });
    } else if (payload.action == "UPDATE") {
      let idx = this.parsers.findIndex(x => x.id == payload.content.id);
      if (idx != -1) {
        this.parsers[idx] = payload.content;
      }
    }
  };

  subscribe(id: string): void {
    this.rt.informCurrentPage(id, ['parser']);
    this.rtHandler = this.rt.addListener("parser", this.rtHandler);
  }

  unsubscribe(): void {
    this.rt.removeListener(this.rtHandler);
  }
}

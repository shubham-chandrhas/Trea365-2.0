import { Injectable, Inject } from "@angular/core";
import { Observable, Observer } from "rxjs";
import { Message } from "../model/chat/message";
import { Event } from "../model/chat/event";
import { HttpService } from "./http.service";
import { APP_CONFIG, AppConfig } from "../../app-config.module";
import { Marker } from "../model/marker/marker";
import * as socketIo from "socket.io-client";
import { DomSanitizer, SafeResourceUrl, SafeUrl } from "@angular/platform-browser";
@Injectable()
export class SocketService {
  private socket;

  constructor(
    @Inject(APP_CONFIG)
    private config: AppConfig,
    public http: HttpService
  ) {}

  public initSocket(): void {
    this.socket = socketIo(this.config.socketServerURL);
  }

  public send(message: Message): void {
    this.socket.emit("message", message);
    const userData = JSON.parse(atob(localStorage.getItem("USER")));
    const today = new Date();
    const date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    const time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + " " + time;
    const reqObj = {
      company_id: userData.company_id,
      receiver_id: message.to,
      message: message.content,
      created_at: dateTime
    };
    this.http.doPost("messaging/send", reqObj, function(
      error: boolean,
      response: any
    ) {});
  }

  public onMessage(): Observable<Message> {
    const userData = JSON.parse(atob(localStorage.getItem("USER")));
    const socketUrl = "message-" + userData.id + ":App\\Events\\Messages";
    return new Observable<Message>(observer => {
      this.socket.on(socketUrl, (data: Message) => observer.next(data));
    });
  }
 public onMarkerData(requestId): Observable<Marker> {
    const socketUrl = `dispatch-${requestId}:App\\Events\\Dispatch`;
    // console.log(socketUrl, requestId);
    return new Observable<Marker>(observer => {
      this.socket.on(socketUrl, (data: Marker) => observer.next(data));
    });
 }
  public onEvent(event: Event): Observable<any> {
    // console.log(event);
    return new Observable<Event>(observer => {
      this.socket.on(event, () => observer.next());
    });
  }
}

import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";
import * as _ from "underscore";

import { UtilService } from "../../../shared/service/util.service";
import { HttpService } from "../../../shared/service/http.service";
import { GlobalService } from "../../../shared/service/global.service";
import { SocketService } from "../../../shared/service/socket.service";
declare var $: any;
import { Message } from "../../../shared/model/chat/message";
import { User } from "../../../shared/model/chat/user";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-messaging",
  templateUrl: "./messaging.component.html",
  styleUrls: ["./messaging.component.css"]
})
export class MessagingComponent implements OnInit {
  loggedInUser: any;
  companyUsers: any[] = [];
  companyUser: any = "";
  userMessages: any[] = [];
  selectedCompanyUsersId = "";
  selectedCompanyUsersName: string = "";
  chatFm: FormGroup;
  user: User;
  today: any;
  yesterday: any;
  week: any;
  createdAt: any[] = [];
  messageContent: string;
  messageList: any[] = [];
  ioConnection: any;
  messages: Message[] = [];
  receciveMsg: any = {};
  recentChatsUsers: any[] = [];
  selectedIndex;
  listType: string;
  searchUser;
  fullName: string;

  @ViewChild("msgScrollMe") private msgScrollContainer: ElementRef;
  receiverName: any;

  constructor(
    public util: UtilService,
    private http: HttpService,
    private global: GlobalService,
    private fb: FormBuilder,
    private socketService: SocketService,
    public route: ActivatedRoute
  ) {
    $(document).ready(function() {
      var height = $(window).height();
      $(".left-chat").css("height", height - 192 + "px");
      $(".right-header-contentChat").css("height", height - 232 + "px");
    });
  }

  ngOnInit() {
    this.util.menuChange({ menu: 8, subMenu: 8 });
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
    this.util.setPageTitle(this.route);
    this.util.setWindowHeight();
    this.getCompanyUsers();
    this.createChatForm();
    this.initIoConnection();
  }

  ngOnDestroy() {
    this.util.setActiveChatUserId(0);
  }

  scrollToBottom(): void {
    try {
      this.msgScrollContainer.nativeElement.scrollTop =
        this.msgScrollContainer.nativeElement.scrollHeight + 60;
    } catch (err) {}
  }

  createChatForm() {
    this.chatFm = this.fb.group({
      chatMsg: new FormControl()
    });
    this.getRecentChats();
  }
  get chatMsg() {
    return this.chatFm.get("chatMsg");
  }

  getCompanyUsers() {
    let self = this;
    self.util.showProcessing("processing-spinner");
    let reqObj: any = this.loggedInUser.company_id;
    try {
      this.http.doGet("messaging/users/" + reqObj, function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (!error) {
          self.companyUsers = response.data;
          self.companyUsers.map(user => {
            user.readStatus =
              user.last_message && user.last_message.is_seen == 0 ? 0 : 1;
            user.selectedUser = 0;
          });
        } else {
          console.log(response);
        }
      });
    } catch (err) {
      this.global.addException("Messaging", "getCompanyUsers", err);
    }
  }

  getRecentChats() {
    let self = this;
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
    self.util.showProcessing("processing-spinner");
    let reqObj: any = this.loggedInUser.company_id;
    try {
      this.http.doGet("messaging/recent-chats/" + reqObj, function(
        error: boolean,
        response: any
      ) {
        self.util.hideProcessing("processing-spinner");
        if (error) {
          console.log(response);
        } else {
          self.recentChatsUsers = response.data.users;
          self.recentChatsUsers.map(user => {
            user.selectedUser = 0;
          });
          self.recentChatsUsers.length > 0
            ? self.showChat(self.recentChatsUsers[0], 0, "recentChatsUser")
            : "";
        }
      });
    } catch (err) {
      this.global.addException("Messaging", "getRecentChats", err);
    }
  }

  showChat(companyUser, index?, type?) {

    this.receiverName = companyUser.first_name;
    let self = this;
    self.createdAt = [];
    self.util.showProcessing("processing-spinner");
    try {
      this.http.doGet(
        "messaging/user-wise-messages/" +
          companyUser.user_id +
          "/" +
          companyUser.company_id,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            console.log(error);
          } else {
            self.resetSelection(self.companyUsers);
            self.resetSelection(self.recentChatsUsers);
            companyUser.last_message = { is_seen: 1 };
            companyUser.selectedUser = companyUser.user_id;
            self.util.removeConversation(companyUser.user_id);
            self.util.setActiveChatUserId(companyUser.user_id);

            self.userMessages = response.data;
            self.selectedCompanyUsersName =
              companyUser.first_name;
            self.selectedCompanyUsersId = companyUser.user_id;
            self.selectedIndex = index;
            self.listType = type;
            self.companyUser = companyUser;
            let date = new Date();
            self.today = date.setHours(0, 0, 0, 0);
            self.yesterday = date.setHours(-24, 0, 0, 0);
            self.week = date.setHours(-168, 0, 0, 0);
            self.userMessages.forEach((element, key) => {
              element.receiver.first_name =
                element.receiver.first_name == null
                  ? ""
                  : element.receiver.first_name;
              self.fullName =
                element.receiver.first_name;
              let dt = self.util.unixTimestampToLocalDate(
                element.unix_timestamp
              ).localDate;

              self.createdAt.push(dt);
              if (self.createdAt.length > 0)
                self.createdAt[key] = self.createdAt[key].getTime();
              element.msgDate = self.util.unixTimestampToLocalDate(
                element.unix_timestamp
              ).localDate;
            });
            setTimeout(function() {
              self.scrollToBottom();
            }, 1000);
          }
        }
      );
    } catch (err) {
      this.global.addException("Messaging", "showChat", err);
    }
  }

  resetSelection(list) {
    list.map(item => {
      item.selectedUser = 0;
    });
  }

  public sendMessage(message: string, receciveId: any): void {
    if (!message) {
      return;
    }
    this.socketService.send({
      from: this.loggedInUser.id,
      to: receciveId,
      content: message
    });
    this.messageContent = null;
  }

  onSubmit(form: FormGroup) {
    let self = this;
    this.sendMessage(
      this.chatFm.get("chatMsg").value,
      this.selectedCompanyUsersId
    );
    let now = new Date().getTime();
    // @Shahebaz (Start)
    let messageTime = new Date();
    // @Shahebaz (End)
    this.createdAt.push(now);
    this.userMessages.push({
      sender_id: this.loggedInUser.id,
      receiver_id: this.selectedCompanyUsersId,
      message: this.chatFm.get("chatMsg").value,
      company_id: this.companyUser.companys_id,
      created_at: now,
      // @Shahebaz (Start)
      msgDate: messageTime
      // @Shahebaz (End)
    });
    this.chatFm.get("chatMsg").setValue("");
    setTimeout(function() {
      self.scrollToBottom();
    }, 1000);
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService
      .onMessage()
      .subscribe((message: any) => {
        console.log(message);
        this.util.playMsgAlert();
        this.messages.push(message);
        this.receciveMsg = message;
        if (message.message.sender_id == this.selectedCompanyUsersId) {
          this.pushNewMessage(message.message);
        } else {
          this.markUnreadStatus(message.message);
        }
      });
  }

  markUnreadStatus(msg) {
    for (let i = 0; i < this.companyUsers.length; i++) {
      if (msg.sender_id == this.companyUsers[i].user_id) {
        this.companyUsers[i].last_message = { is_seen: 0 };
        this.companyUsers[i].readStatus = 0;
        this.companyUsers = _.sortBy(this.companyUsers, "readStatus");
        break;
      }
    }
    console.log("Company Users: ", this.companyUsers);
  }

  pushNewMessage(msg) {
    let self = this;
    let now = new Date().getTime();

    // @Shahebaz (Start)
    let messageTime = new Date();
    // @Shahebaz (End)

    this.createdAt.push(now);
    this.readMessages(msg.sender_id, msg.company_id);
    this.userMessages.push({
      message_id: msg.message_id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      message: msg.message,
      company_id: msg.company_id,
      created_at: now,
      // @Shahebaz (Start)
      msgDate: messageTime
      // @Shahebaz (End)
    });
    setTimeout(function() {
      self.scrollToBottom();
    }, 1000);
  }

  readMessages(senderId, companyId) {
    let self = this;
    try {
      this.http.doGet(
        "messaging/mark-recieved-msg/" + senderId + "/" + companyId,
        function(error: boolean, response: any) {
          self.util.hideProcessing("processing-spinner");
          if (error) {
            console.log(response);
          }
        }
      );
    } catch (err) {
      this.global.addException("Messaging", "readMessages", err);
    }
  }
}

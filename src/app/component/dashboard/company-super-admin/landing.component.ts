/* *
 *     	Company Super Admin Landing Component
 *  	cognitoService used to logout the current logged in user
 * */
// import "rxjs/add/operator/filter";
// import "rxjs/add/operator/pairwise";

import {
  Component,
  Inject,
  OnInit,
  AfterViewInit,
  ViewChild,
  Renderer,
  ElementRef,
  AfterViewChecked
} from "@angular/core";
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";

import { Router, ActivatedRoute } from "@angular/router";

import { Observable } from "rxjs";
import { startWith, map } from "rxjs/operators";
import { Location, DOCUMENT } from "@angular/common";
import { AwsCognitoService } from "../../../auth/aws-cognito.service";
import { UtilService } from "../../../shared/service/util.service";
import { SocketService } from "../../../shared/service/socket.service";
import { HttpService } from "../../../shared/service/http.service";
import { ConstantsService } from "../../../shared/service/constants.service";

import { Action } from "../../../shared/model/chat/action";
import { Event } from "../../../shared/model/chat/event";
import { Message } from "../../../shared/model/chat/message";
import { User } from "../../../shared/model/chat/user";

declare var $: any;

export class Name {
  constructor(public name: string) {}
}

@Component({
  selector: "app-comp-su-admin",
  templateUrl: "./landing.html"
})
export class CSALandingComponent
  implements OnInit, AfterViewInit, AfterViewChecked {
  public companyInfo: any;
  public arrowIcon = false;
  public selL1Menu: string;
  public selL2Menu: string;
  public menuList: any[];
  public receciveMsg: any = "";
  public nameCtrl: FormControl;
  public filteredNames: Observable<any[]>;
  ioConnection: any;
  messages: Message[] = [];
  messageList: any[] = [];
  user: User;
  messageContent: string;
  chatFm: FormGroup;
  loggedInUser;
  chatBox: any[] = [];
  isOpen = false;
  isChatOpen = false;
  unreadMsgs = 0;
  compUsersList: any[] = [];
  searchStatus = false;
  chatBoxUserId: any = "";
  noName = true;
  @ViewChild("scrollMe") private myScrollContainer: ElementRef;

  names: Name[] = [
    {
      name: "Yogesh Mane"
    },
    {
      name: "Agnes"
    },
    {
      name: "Billy"
    },
    {
      name: "Calvin"
    },
    {
      name: "Christina"
    }
  ];
  recentChatUser: any;
  recentChatUserName: string;
  recentChatCount: any;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cognitoService: AwsCognitoService,
    public util: UtilService,
    private renderer: Renderer,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpService,
    private socketService: SocketService,
    private constant: ConstantsService,
    private route: ActivatedRoute
  ) {
    this.nameCtrl = new FormControl();
    this.filteredNames = this.nameCtrl.valueChanges.pipe(
      startWith(""),
      map(data => (data ? this.filterNames(data) : this.compUsersList.slice()))
    );
    this.menuList = this.util.getMenulist();
    this.loggedInUser = JSON.parse(atob(localStorage.getItem("USER")));
  }

  ngOnInit() {
    const self = this;
    window.scrollTo(0, 0);
    this.util.setLoggedInUserName(
      this.loggedInUser.last_name
        ? this.loggedInUser.first_name + " " + this.loggedInUser.last_name
        : this.loggedInUser.first_name
    );
    this.util.setRoleName(this.loggedInUser.role.role_name);
    this.renderer.setElementClass(document.body, "bg-img", false);
    this.getCompanyInfo();
    // this.getUsersList();
    this.util.newMenuSelection.subscribe(menu =>
      setTimeout(() => {
        if (menu) {
          this.selL1Menu = menu.menu;
          this.selL2Menu = menu.subMenu;
        }
      }, 0)
    );
    $(".live-chat-class").css("display", "none");
    this.toggleArrow();
    (function() {
      $("#live-chat header").on("click", function() {
        self.unreadMsgs = 0;
        self.isChatOpen = self.isChatOpen ? false : true;
        $(".chat").slideToggle(300, "swing");
      });
      $(".chat-close").on("click", function(e) {
        e.preventDefault();
        $(".live-chat-class").fadeOut(300);
        self.searchStatus = false;
        self.chatBox = [];
        self.nameCtrl.setValue("");
      });
    })();

    this.chatFm = this.fb.group({
      chatMsg: new FormControl(),
      chatBoxId: new FormControl()
    });

    const AVATAR_URL = "https://api.adorable.io/avatars/285";

    this.user = {
      id: this.loggedInUser.id,
      avatar: `${AVATAR_URL}/12111.png`,
      name: this.loggedInUser.first_name + " " + this.loggedInUser.last_name
    };
    this.scrollToBottom();

    if (
      JSON.parse(atob(localStorage.getItem("USER"))).company &&
      JSON.parse(atob(localStorage.getItem("USER"))).company.is_active === 2
    ) {
      sessionStorage.getItem("WORNING_FLAGE") &&
      sessionStorage.getItem("WORNING_FLAGE") == "1"
        ? self.util.showAlertToast("Warning", this.constant.WORNING_AC_MSG)
        : "";
    }
    this.util.updatePagination();
  }

  ngAfterViewInit() {
    //  for CSV Upload
    if (this.router.url.split("/")[2] === "csv-preview") {
      $(".content-wrapper").css("min-height", 900);
    }
    $(" #leftside-navigation > ul > li > ul > li > a").click(function(event) {
      if (800 > window.innerHeight) {
        $(".content-wrapper").css("min-height", 800);
      }
    });

    $("#leftside-navigation > ul > li > a").click(function(event) {
      $("#leftside-navigation ul ul").slideUp(function(e) {
        $("#leftside-navigation ul li").removeClass("menu-open");
        $(".content-wrapper").css(
          "min-height",
          window.innerHeight -
            $(".main-header").height() -
            $(".main-footer").height() -
            20
        );
      }),
        $(this)
          .next()
          .is(":visible") ||
          $(this)
            .next()
            .slideDown(function() {
              const self = $(this).closest("li");
              $(self[0]).addClass("menu-open");
              const sidebarHeight = $("#leftside-navigation").height() || 0;
              if (sidebarHeight > window.innerHeight) {
                $(".content-wrapper").css("min-height", sidebarHeight);
              } else {
                $(".content-wrapper").css(
                  "min-height",
                  window.innerHeight -
                    $(".main-header").height() -
                    $(".main-footer").height() -
                    20
                );
              }
            }),
        event.stopPropagation();
    });

    // Check connection 
    this.initIoConnection();
    
  }

  adjustHeight() {}

  filterNames(name: string) {
    return this.compUsersList.filter(
      data => data.name.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  openChatBox() {
    if (!this.isChatOpen) {
      $(".live-chat-class").css("display", "block");
      this.isOpen = true;
      this.isChatOpen = true;
      this.unreadMsgs = 0;
      this.recentChatCount = 0;
    } else {
      $(".live-chat-class").css("display", "none");
      this.isOpen = false;
      this.isChatOpen = false;
      this.unreadMsgs = 0;
      this.resetChat();
    }
  }

  goToOnboarding() {
    sessionStorage.setItem("refreshStatus", "1");
    this.router.navigate(["/csa-onboarding"]);
  }

  toggleArrow(): void {
    this.arrowIcon = !this.arrowIcon;
    this.renderer.setElementClass(
      document.body,
      "sidebar-collapse",
      !this.arrowIcon
    );
  }

  getCompanyInfo(): void {
    const self = this;
    this.cognitoService.getCompanyInfo(function(err, res) {
      if (!err) {
        self.companyInfo = res.data;
        self.util.setCompanyId(res.data.company_id);
        self.util.setCompanyName(res.data.company_name);
        self.util.setCurrency(res.data.currency);
        self.util.setCurrencySign(res.data.currency_sign);
        self.util.setCountryCode(self.loggedInUser.country_code);
        self.util.setRole(self.loggedInUser.role_id);
        self.util.setCompanyLogo(res.data.company_logo);
        self.util.setCompanyAddress(res.data.address_line1);
      }
    });
  }

  getUsersList(): void {
    const self = this;
    this.http.doGet(
      "messaging/users/" +
        JSON.parse(atob(localStorage.getItem("USER"))).company_id,
      function(error: boolean, response: any) {
        if (error) {
        } else {
          self.compUsersList = response.data.filter(
            item => (item.name = item.first_name + " " + item.last_name)
          );
          self.compUsersList.map(user => {
            if (
              user.last_message &&
              user.last_message.is_seen == 0 &&
              user.user_id == self.loggedInUser.id
            ) {
              self.util.getUnreadConversation().includes(user.user_id)
                ? ""
                : self.util.addUnreadConversation(user.user_id);
            }
          });
        }
      }
    );
  }

  getSelectedUser(user, event): void {
    let self = this;
    self.searchStatus = true;
    self.util.addSpinner("chatHistory", "loading...");
    if (event.isUserInput) {
      this.http.doGet(
        "messaging/user-wise-messages/" + user.user_id + "/" + user.company_id,
        function(error: boolean, response: any) {
          self.util.removeSpinner("chatHistory", " ");
          if (!error) {
            let recieverMsgs = [];
            response.data.forEach(element => {
              const today = new Date(element.unix_timestamp * 1000);
              const date =
                today.getFullYear() +
                "-" +
                (today.getMonth() + 1) +
                "-" +
                today.getDate();
              const time =
                today.getHours() +
                ":" +
                today.getMinutes() +
                ":" +
                today.getSeconds();
              const dateTime = date + " " + time;
              let from =
                element.sender_id == self.loggedInUser.id ? "self" : "other";
              recieverMsgs.push({
                date: dateTime,
                senderName: element.sender.first_name,
                senderId: element.sender.id,
                messageTxt: element.message,
                from: from
              });
            });
            self.chatBox.push({
              receiverId: user.user_id,
              receiverName: user.name,
              recieverMsgs: recieverMsgs
            });
          } else {
            console.log("Error: ", error);
          }
        }
      );
    }
  }
  getRecentChats() {
    let self = this;
    let reqObj: any = this.loggedInUser.company_id;
    try {
      this.http.doGet("messaging/recent-chats/" + reqObj, function(
        error: boolean,
        response: any
      ) {
        if (error) {
          console.log(response);
        } else {
          self.recentChatUser = response.data.users[0];
          const fullName =
            response.data.users[0].first_name +
            " " +
            response.data.users[0].last_name;
          self.recentChatUserName = fullName.trim();
          if (self.recentChatUserName) {
            self.getRecentChatMessages(self.recentChatUser, false);
          }
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  getRecentChatMessages(user, spinner = true) {
    let self = this;
    this.http.doGet(
      "messaging/user-wise-messages/" + user.user_id + "/" + user.company_id,
      function(error: boolean, response: any) {
        if (spinner) self.util.removeSpinner("chatHistory", " ");
        if (!error) {
          let recieverMsgs = [];
          response.data.forEach(element => {
            const today = new Date(element.unix_timestamp * 1000);
            const date =
              today.getFullYear() +
              "-" +
              (today.getMonth() + 1) +
              "-" +
              today.getDate();
            const time =
              today.getHours() +
              ":" +
              today.getMinutes() +
              ":" +
              today.getSeconds();
            const dateTime = date + " " + time;
            let from =
              element.sender_id == self.loggedInUser.id ? "self" : "other";
            recieverMsgs.push({
              date: dateTime,
              senderName: element.sender.first_name,
              senderId: element.sender.id,
              messageTxt: element.message,
              from: from
            });
          });

          if (
            !self.isMessagePresent({
              receiverId: user.user_id,
              receiverName: user.name,
              recieverMsgs: recieverMsgs
            })
          ) {
            self.chatBox.push({
              receiverId: user.user_id,
              receiverName: user.name,
              recieverMsgs: recieverMsgs
            });
          } else {
            self.chatBox = self.chatBox.map(msg => {
              if (user.user_id == msg.receiverId) {
                msg.recieverMsgs = recieverMsgs;
              }
              return msg;
            });
          }
        } else {
          console.log("Error: ", error);
        }
      }
    );
  }

  isMessagePresent(msg): boolean {
    for (let i = 0; i < this.chatBox.length; i++) {
      if (this.chatBox[i].receiverId == msg.receiverId) {
        return true;
      }
    }

    return false;
  }

  resetChat() {
    this.messageList = [];
    this.chatBox = [];
    this.searchStatus = false;
    this.receciveMsg = "";
    this.recentChatCount = 0;
    $(".live-chat-class").fadeOut(300);
    this.nameCtrl.setValue("");
  }
  logout(): void {
    this.cognitoService.logout();
  }

  // Socket Code
  private initIoConnection(): void {

    this.socketService.initSocket();

    this.ioConnection = this.socketService
      .onMessage()
      .subscribe((message: any) => {
        if (this.util.getActiveChatUserId() != message.message.sender_id) {
          this.updateCount(message.message);
          this.getRecentChats();
        }
      });
    this.socketService.onEvent(Event.CONNECT).subscribe(() => {
      console.log("connected");
    });

    this.socketService.onEvent(Event.DISCONNECT).subscribe(() => {
      console.log("disconnected");
    });
  }

  updateCount(msg) {
    if (this.util.getUnreadConversation().includes(msg.sender_id)) {
      return;
    } else {
      this.util.addUnreadConversation(msg.sender_id);
      this.recentChatCount = this.util.getUnreadConversation().length;
    }
  }

  addMessage(message) {
    console.log(message);
    if (this.chatBox.length > 0) {
      let isAdded = false;
      this.chatBox.forEach((element, key) => {
        if (
          element.receiverId == message[0].sender_id ||
          message[0].sender_id == this.loggedInUser.id
        ) {
          element.recieverMsgs = [];
          message.forEach(messageList => {
            let from =
              messageList.sender_id == this.loggedInUser.id ? "self" : "other";
            element.recieverMsgs.push({
              date: new Date(),
              senderName: messageList.senderName,
              senderId: messageList.sender
                ? messageList.sender.id
                : messageList.senderId,
              messageTxt: messageList.message,
              from: from
            });
            isAdded = true;
          });
        }
      });
      if (!isAdded) {
        this.chatBox.push(this.createChatBox(message));
      }
    } else {
      this.chatBox.push(this.createChatBox(message));
    }
  }
  // openChatBox
  createChatBox(message) {
    let receiveMsg = [];
    message.forEach(element => {
      let from = element.sender_id == this.loggedInUser.id ? "self" : "other";
      receiveMsg.push({
        date: new Date(),
        messageTxt: element.message,
        senderId: element.sender.id,
        senderName: element.sender.first_name,
        from: from
      });
    });
    return {
      receiverId: message[0].sender_id,
      receiverName: message[0].sender.first_name,
      recieverMsgs: receiveMsg
    };
  }

  public sendMessage(message: string, receiverId: any): void {
    if (!message) return;

    this.socketService.send({
      from: this.user,
      to: receiverId,
      content: message
    });
    this.messageContent = null;
  }

  public sendNotification(params: any, action: Action): void {
    let message: Message;

    if (action === Action.JOINED) {
      message = {
        from: this.user,
        action: action
      };
    } else if (action === Action.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user.name,
          previousUsername: params.previousUsername
        }
      };
    }

    this.socketService.send(message);
  }

  get chatMsg() {
    return this.chatFm.get("chatMsg");
  }
  get chatBoxId() {
    return this.chatFm.get("chatBoxId");
  }
  onSubmit(form: FormGroup, id) {
    this.isChatOpen = true;
    this.sendMessage(this.chatFm.get("chatMsg").value, id);
    if (!this.chatFm.get("chatMsg").value) return;

    let obj = this.chatBox.find(item => item.receiverId == id);
    let index = this.chatBox.indexOf(obj);
    this.chatBox[index].recieverMsgs.push({
      date: new Date(),
      messageTxt: this.chatFm.get("chatMsg").value,
      from: "self"
    });
    this.chatFm.get("chatMsg").setValue("");
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}

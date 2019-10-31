import {Injectable} from "@angular/core";
@Injectable()
export class ConstantsService {
  //  for masking regex..
  TIME_MASK = [/[0-9]/, /\d/, ":", /\d/, /\d/];
  PHONE_NUMBER_MASK = [/[1-9]/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
  MOBILE_NUMBER_MASK = [/[1-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

  // validation regex..
  EMAIL_PATTERN = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
  TIME_PATTERN = /^(1[0-2]|0?[1-9]):[0-5][0-9]$/;
  //  TIME_PATTERN = /(((0[1-9])|(1[0-2])):([0-5])(0|5))/;
  MOBILE_PATTERN = /^([0|\+[0-9]{1,5})?([1-9][0-9]{9})$/;
  PHONE_PATTERN = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/; // allow dash with only numbers
  // PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,30}$/;
  PASSWORD_PATTERN = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  // POSTAL_CODE_PATTERN=/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  POSTAL_CODE_PATTERN = /^[A-Za-z\d\s-]+$/;
  REQ_ONE_CHAR_PATTERN = /^(?!\s*$)[-a-zA-Z0-9_:,.\s]{2,100}$/;
  AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
  AMOUNT_PATTERN_3DECIMAL = /^\d+(\.\d{1,3})?$/;
  AMOUNT_NEG_PATTERN = /^-?[0-9]\d*(\.\d+)?$/;
  NO_SPACE_PATTERN = /^\S*$/;
  ONLY_NUMBER = /^\d+$/;
  ONLY_NUMBER_WITHOUT_ZERO = /(^[1-9]\d{0,8}$)/;
  POS_AND_NEQ_NUMBERS_PATTERN = /^-?\d*\.?\d+$/;
  DECIMAL_NUMBERS_PATTERN = /^\d+\.\d$/;
  WHITE_SPACE_PATTERN = /^\s* /g;
  ALPHA_NUMERIC_PATTERN = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
  DECIMAL_ALPHA_PATTERN = /^[a-zA-z0-9]+$/;
// tslint:disable-next-line: max-line-length
  WEBSITE_PATTERN = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  // DATA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  DATA_PATTERN = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
  CODE39_WITH_SPACE_PATTERN = /^[A-Za-z\d\s-/.+%$]+$/;
  CODE39_WITHOUT_SPACE_PATTERN = /^[A-Za-z\d-/.+%$]+$/;
  DAYS = "Days";
  // for Pagination
  DEFAULT_PAGINATION_ITEMS: any = [5, 10, 15, 20, 25, 50, 100, 150, 200];
  PAGINATION_ITEMS: any = [5, 10, 15, 20, 25, 50, 100, 150, 200]; // for development
  // PAGINATION_ITEMS:any = [1,2,3,4,5,6,7,8,9,10,15]; // for testing only
  ITEM_COUNT = 0;
  CURRENT_PAGE = 1;
  ITEMS_PER_PAGE = 15;
  DEFAULT_ITEMS_PER_PAGE = 15;
  DEFAULT_MAX_PRICE = 1000000;
  DEFAULT_TEXT_MAXLENGTH = 120;
  DEFAULT_NAME_MAXLENGTH = 250;
  DEFAULT_COMMENT_MAXLENGTH = 10000;
  NA = "-"; // Not Available
  COMMA = ",";
  N_A = "N/A";

  EXCEPTIONAL_MSG = "Oops something went wrong please contact to Trea365 administrator.";
// tslint:disable-next-line: max-line-length
  SUSPENDED_AC_MSG = "Your account has been suspended. Please contact your company administrator or Call XXX-XXX-XXXX to speak with a TREA 365 Representative.";
  WORNING_AC_MSG = "Your payment is due, Please pay your bill, if you want to continue using the Trea365.";
  SET_PASSWORD_ERR_MSG = "Your registration process is incomplete; Please complete registration process with set password to login.";
  UNAUTHORISED_USER_MSG = "You are not authorised user to access this platform please contact to Trea365 administrator. ";
  NO_PERMISSION_MSG = "You don't have access to system. Please contact your administrator.";
  NO_ACCESS_PERMISSION_MSG = "You don't have permission to access page."; // New Message By ravindra
  DELETED_AC_MSG = `Your account has been deleted. Please contact your
  company administrator or Call XXX-XXX-XXXX to speak with a TREA 365 Representative.`;
// Payment Status
  PAYMENT_STATUS = {
      1: "Paid",
      2: "Due",
      3: "Past Due",
      4: "Past Due 90",
  };
  //  ITEM_TYPES
  ITEM_TYPES = {
    1: "Product",
    2: "Asset",
    3: "Material",
  };
  MENU_LIST: any[] = [{
    //   "menuId": 1000,
    //   "menuName": "Dashboard",
    //   "menuIcon": "assets/icon/dashboard_icon.png",
    //   "link": "/c-dashboard/csa/summary",
    //   "subMenu": []
    'menuId' : 1000,
    'menuName' : 'Dashboard',
    'menuIcon' : 'assets/icon/dashboard_icon.png',
    'link' : '/c-dashboard/csa/summary',
        'subMenu' :[{
            'subMenuId' : 9000,
            'subMenuName' : 'Summary',
            'subMenuIcon' : '',
            'link' : '/c-dashboard/csa/summary',
        }
        ,{
            'subMenuId' : 10000,
            'subMenuName' : 'Reports',
            'subMenuIcon' : '',
            'link' : '/c-dashboard/csa/reports',
        }]
    }, {
      "menuId": 2,
      "menuName": "Admin",
      "menuIcon": "assets/icon/admin_icon.png",
      "link": "",
      "subMenu": [{
        "subMenuId": 11,
        "subMenuName": "Services",
        "subMenuIcon": "",
        "link": "/admin/csa/service/0",
      }, {
        "subMenuId": 12,
        "subMenuName": "Locations",
        "subMenuIcon": "",
        "link": "/admin/csa/location-list/0",
       },
       {
        "subMenuId": 13,
        "subMenuName": "Manufacturers",
        "subMenuIcon": "",
        "link": "/admin/csa/manufacturer/0",
      }, {
        "subMenuId": 14,
        "subMenuName": "Item Definition",
        "subMenuIcon": "",
        "link": "/admin/csa/manufacturer-part/0",
      }, {
        "subMenuId": 16,
        "subMenuName": "Suppliers",
        "subMenuIcon": "",
        "link": "/admin/csa/supplier-list/0",
      },
      {
        "subMenuId": 18,
        "subMenuName": "Labels",
        "subMenuIcon": "",
        "link": "/admin/csa/print-label",
      }]
    }, {
      "menuId": 3,
      "menuName": "Inventory",
      "menuIcon": "assets/icon/inventory_icon.png",
      "link": "",
      "subMenu": [{
        "subMenuId": 19,
        "subMenuName": "Products",
        "menuIcon": "",
        "link": "/inventory/csa/product-list/0",
      }, {
        "subMenuId": 20,
        "subMenuName": "Assets",
        "menuIcon": "",
        "link": "/inventory/csa/asset-list/0"
      }, {
        "subMenuId": 34,
        "subMenuName": "Materials",
        "menuIcon": "",
        "link": "/inventory/csa/material-list/0"
      }, {
        "subMenuId": 35,
        "subMenuName": "Tracker",
        "menuIcon": "",
        "link": "/inventory/csa/tracker/0"
      }, {
        "subMenuId": 21,
        "subMenuName": "Maintenance",
        "menuIcon": "",
        "link": "/inventory/csa/maintenance-list/0"
      }, {
        "subMenuId": 22,
        "subMenuName": "P/O",
        "menuIcon": "",
        "link": "/inventory/po/csa/purchase-order-list/0"
      }, {
        "subMenuId": 23,
        "subMenuName": "R/S",
        "menuIcon": "",
        "link": "/inventory/rs/csa/receiving-slips-list/0"
      }, {
        "subMenuId": 24,
        "subMenuName": "Audit",
        "menuIcon": "",
        "link": "/inventory/audit/csa/audit-list/0"
      }]
    }, {
      "menuId": 4,
      "menuName": "Workflow",
      "menuIcon": "assets/icon/workflow_icon.png",
      "link": "",
      "subMenu": [{
        "subMenuId": 25,
        "subMenuName": "Quotations",
        "subMenuIcon": "",
        "link": "/workflow/quote/csa/quotation-list/0"
      }, {
        "subMenuId": 26,
        "subMenuName": "Work Orders",
        "subMenuIcon": "",
        "link": "/workflow/wo/csa/work-order-list/0"
      }, {
        "subMenuId": 27,
        "subMenuName": "Scheduling",
        "subMenuIcon": "",
        "link": "/workflow/schedule/csa/schedule-timeline"
      }]
    }, {
      "menuId": 9,
      "menuName": "Dispatch", // Dashboard
      "menuIcon": "assets/icon/inventory_icon.png",
      "link": "/dispatch/csa/dashboard",
      "subMenu": []
    },
    {
      "menuId": 5,
      "menuName": "CRM",
      "menuIcon": "assets/icon/dashboard_icon.png",
      "link": "/crm/csa/client-list/0",
      "subMenu": []
    },
    {
      "menuId": 6,
      "menuName": "HR",
      "menuIcon": "assets/icon/hr_icon.png",
      "link": "",
      "subMenu": [{
        "subMenuId": 28,
        "subMenuName": "Employees",
        "subMenuIcon": "",
        "link": "/hr/csa/employee-list/0"
      }, {
        "subMenuId": 29,
        "subMenuName": "Sub-Contractor",
        "subMenuIcon": "",
        "link": "/hr/csa/sub-contractor-list/0"
      }, {
        "subMenuId": 30,
        "subMenuName": "Timesheets",
        "subMenuIcon": "",
        "link": "/hr/csa/timesheet-list/0"
      }]
    }, {
      "menuId": 7,
      "menuName": "Financials",
      "menuIcon": "assets/icon/accounting_icon.png",
      "link": "",
      "subMenu": [{
          "subMenuId": 32,
          "subMenuName": "Receivables",
          "subMenuIcon": "",
          "link": "/account/csa/acc-receivables/0"
        }, {
          "subMenuId": 37,
          "subMenuName": "Payables",
          "subMenuIcon": "",
          "link": "/account/csa/acc-payables/0"
        }, {
          "subMenuId": 33,
          "subMenuName": "Invoice List",
          "subMenuIcon": "",
          "link": "/account/csa/invoice-list/0"
        }
        //  },{
        //      "subMenuId" : 36,
        //      "subMenuName" : "Create Invoice",
        //      "subMenuIcon" : "",
        //      "link" : "/account/csa/new-invoice"
        //  },{
        , {
          "subMenuId": 34,
          "subMenuName": "Ledger",
          "subMenuIcon": "",
          "link": "/account/csa/ledger-list/0"
        }
      ]
    }, {
      "menuId": 8,
      "menuName": "Messaging",
      "menuIcon": "assets/icon/message_icon.png",
      "link": "/message/csa/messaging",
      "subMenu": []
    }
  ];
}
